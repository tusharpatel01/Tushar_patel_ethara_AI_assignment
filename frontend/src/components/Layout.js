import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
