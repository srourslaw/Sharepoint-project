import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import gemlifeIcon from '../GemLife_Logo-1.svg';
import useAuth from '../hooks/useAuth';
import SchoolIcon from '@mui/icons-material/School';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import LogoutIcon from '@mui/icons-material/Logout';
import FaceIcon from '@mui/icons-material/Face';

const CustomNavigation = ({ results }) => {
  const { isAuth, authInfo } = useAuth();

  const parseSharableObj = () => {
    const sharableLocalObj = [
      // 'authToken',
      // 'accessibleResorts',
      // 'accessibleResorts_withEdit',
    ];
    let objToSend = {};
    for (let i = 0; i < sharableLocalObj.length; i++) {
      if (localStorage.getItem(sharableLocalObj[i]) !== null)
        objToSend[sharableLocalObj[i]] = localStorage.getItem(
          sharableLocalObj[i],
        );
    }
    return objToSend;
  };

  const handleSettingClick = (action) => {
    if (action.toLowerCase() === 'knowledge base') {
      window.open('https://gemlife.sharepoint.com/sites/GemDocs-KB', '_blank');
    }

    if (action.toLowerCase() === 'sign in with a different account') {
      localStorage.clear();
      window.location.href = '/true';
    }

    if (action.toLowerCase() === 'switch to cct') {
      const obj = parseSharableObj();
      const targetWindow = window.open(`${process.env.REACT_APP_CCT_URL}/main`);
      setTimeout(() => {
        targetWindow.postMessage(
          JSON.stringify(obj),
          `${process.env.REACT_APP_CCT_URL}/main`,
        );
      }, 1000);
    }

    if (action.toLowerCase() === 'logout') {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const pages = [];
  const settings = [
    'Logout',
    'Switch to CCT',
    'Knowledge Base',
    `Logged in as: ${authInfo?.account?.username}`,
    'Sign In with a different account',
  ];

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const NAV_COLORS = {
    dev: '#0505FF',
    uat: '#00007A', // Dark Blue
    prod: 'rgb(41, 152, 111)', // Default Green
  };

  const navBackgroundColor =
    NAV_COLORS[process.env.REACT_APP_ENV] || NAV_COLORS.prod;
  return (
    <div>
      <AppBar
        elevation={1}
        sx={{ backgroundColor: navBackgroundColor }}
        position="static"
      >
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
                margin: '0px 0px 0px -15px',
              }}
            >
              <img
                style={{ maxHeight: '64px', maxwidth: '130px', width: '130px' }}
                src={gemlifeIcon}
              ></img>
            </Typography>
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <img
                style={{ maxHeight: '64px', maxwidth: '130px', width: '130px' }}
                src={gemlifeIcon}
              ></img>
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {page}
                </Button>
              ))}
            </Box>
            <Box
              sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}
              gap={2}
            >
              {results && results.length > 0 && (
                <Typography
                  sx={{
                    fontSize: '13px',
                  }}
                >
                  Total Results: {results.length}
                </Typography>
              )}
              {isAuth && (
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      alt={authInfo?.account?.name}
                      src="/static/images/avatar/2.jpg"
                    />
                  </IconButton>
                </Tooltip>
              )}
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem
                    key={setting}
                    onClick={() => {
                      handleCloseUserMenu();
                      handleSettingClick(setting);
                    }}
                    sx={{ justifyContent: 'right' }}
                    disabled={setting.includes('Logged in as')}
                  >
                    <Typography variant="caption">{setting}</Typography>

                    {setting.toLowerCase() === 'knowledge base' ? (
                      <SchoolIcon
                        sx={{ margin: '0px 0px 0px 10px', color: 'gray' }}
                      />
                    ) : (
                      <></>
                    )}
                    {setting.toLowerCase() ===
                    'sign in with a different account' ? (
                      <ExitToAppIcon
                        sx={{ margin: '0px 0px 0px 10px', color: 'gray' }}
                      />
                    ) : (
                      <></>
                    )}
                    {setting.toLowerCase() === 'switch to cct' ? (
                      <SwitchAccountIcon
                        sx={{ margin: '0px 0px 0px 10px', color: 'gray' }}
                      />
                    ) : (
                      <></>
                    )}
                    {setting.toLowerCase() === 'logout' ? (
                      <LogoutIcon
                        sx={{ margin: '0px 0px 0px 10px', color: 'gray' }}
                      />
                    ) : (
                      <></>
                    )}
                    {setting.toLowerCase().includes('logged') ? (
                      <FaceIcon
                        sx={{ margin: '0px 0px 0px 10px', color: 'gray' }}
                      />
                    ) : (
                      <></>
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
};

export default CustomNavigation;
