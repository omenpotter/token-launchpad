import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Launchpad from './pages/Launchpad';
import LiquidityPool from './pages/LiquidityPool';
import TokenVerification from './pages/TokenVerification';
import Trade from './pages/Trade';
import X1TokenLauncher from './pages/X1TokenLauncher';
import index from './pages/index';
import Minting from './pages/Minting';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateToken": CreateToken,
    "Dashboard": Dashboard,
    "Home": Home,
    "Launchpad": Launchpad,
    "LiquidityPool": LiquidityPool,
    "TokenVerification": TokenVerification,
    "Trade": Trade,
    "X1TokenLauncher": X1TokenLauncher,
    "index": index,
    "Minting": Minting,
}

export const pagesConfig = {
    mainPage: "X1TokenLauncher",
    Pages: PAGES,
    Layout: __Layout,
};