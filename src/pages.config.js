import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Launchpad from './pages/Launchpad';
import LiquidityPool from './pages/LiquidityPool';
import Minting from './pages/Minting';
import Trade from './pages/Trade';
import X1TokenLauncher from './pages/X1TokenLauncher';
import TokenVerification from './pages/TokenVerification';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateToken": CreateToken,
    "Dashboard": Dashboard,
    "Home": Home,
    "Launchpad": Launchpad,
    "LiquidityPool": LiquidityPool,
    "Minting": Minting,
    "Trade": Trade,
    "X1TokenLauncher": X1TokenLauncher,
    "TokenVerification": TokenVerification,
}

export const pagesConfig = {
    mainPage: "X1TokenLauncher",
    Pages: PAGES,
    Layout: __Layout,
};