import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import Launchpad from './pages/Launchpad';
import LiquidityPool from './pages/LiquidityPool';
import Minting from './pages/Minting';
import Trade from './pages/Trade';
import X1TokenLauncher from './pages/X1TokenLauncher';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateToken": CreateToken,
    "Dashboard": Dashboard,
    "Launchpad": Launchpad,
    "LiquidityPool": LiquidityPool,
    "Minting": Minting,
    "Trade": Trade,
    "X1TokenLauncher": X1TokenLauncher,
}

export const pagesConfig = {
    mainPage: "X1TokenLauncher",
    Pages: PAGES,
    Layout: __Layout,
};