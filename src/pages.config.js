import CreateToken from './pages/CreateToken';
import LiquidityPool from './pages/LiquidityPool';
import X1TokenLauncher from './pages/X1TokenLauncher';
import Minting from './pages/Minting';
import Dashboard from './pages/Dashboard';
import Launchpad from './pages/Launchpad';
import Trade from './pages/Trade';


export const PAGES = {
    "CreateToken": CreateToken,
    "LiquidityPool": LiquidityPool,
    "X1TokenLauncher": X1TokenLauncher,
    "Minting": Minting,
    "Dashboard": Dashboard,
    "Launchpad": Launchpad,
    "Trade": Trade,
}

export const pagesConfig = {
    mainPage: "X1TokenLauncher",
    Pages: PAGES,
};