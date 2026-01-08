import LiquidityPool from './pages/LiquidityPool';
import X1TokenLauncher from './pages/X1TokenLauncher';
import CreateToken from './pages/CreateToken';


export const PAGES = {
    "LiquidityPool": LiquidityPool,
    "X1TokenLauncher": X1TokenLauncher,
    "CreateToken": CreateToken,
}

export const pagesConfig = {
    mainPage: "X1TokenLauncher",
    Pages: PAGES,
};