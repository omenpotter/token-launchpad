import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REPORT_THRESHOLD = 5; // Number of reports to trigger re-analysis
const ABUSE_TIME_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_REPORTS_PER_USER = 3; // Max reports per user per time window

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mintAddress, reason, category } = await req.json();

    if (!mintAddress || !reason) {
      return Response.json({ 
        error: 'Mint address and reason required' 
      }, { status: 400 });
    }

    // Check for abuse - user reporting too frequently
    const recentReports = await base44.asServiceRole.entities.TokenReport.filter({
      reporter: user.email,
      created_date: { $gte: new Date(Date.now() - ABUSE_TIME_WINDOW).toISOString() }
    });

    if (recentReports.length >= MAX_REPORTS_PER_USER) {
      return Response.json({ 
        error: 'Report limit reached. Please wait before submitting more reports.' 
      }, { status: 429 });
    }

    // Create report
    await base44.asServiceRole.entities.TokenReport.create({
      mintAddress,
      reason,
      category: category || 'suspicious',
      reporter: user.email,
      status: 'pending',
      reportedAt: new Date().toISOString()
    });

    // Check if threshold reached for re-analysis
    const allReports = await base44.asServiceRole.entities.TokenReport.filter({
      mintAddress,
      status: 'pending'
    });

    let shouldReanalyze = false;
    let message = 'Report submitted successfully';

    if (allReports.length >= REPORT_THRESHOLD) {
      // Trigger automated re-analysis
      shouldReanalyze = true;
      message = 'Report submitted. Threshold reached - automated re-analysis triggered';

      // Call verification function to re-analyze
      try {
        await base44.asServiceRole.functions.invoke('verifyToken', {
          mintAddress,
          network: 'x1Mainnet',
          isReanalysis: true
        });

        // Mark all reports as reviewed
        for (const report of allReports) {
          await base44.asServiceRole.entities.TokenReport.update(report.id, {
            status: 'reviewed',
            reviewedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Re-analysis failed:', error);
      }
    }

    return Response.json({
      success: true,
      message,
      reportsCount: allReports.length,
      threshold: REPORT_THRESHOLD,
      shouldReanalyze
    });

  } catch (error) {
    console.error('Report error:', error);
    return Response.json({ 
      error: 'Failed to submit report: ' + error.message 
    }, { status: 500 });
  }
});