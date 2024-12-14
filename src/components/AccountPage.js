import React, { useState } from 'react';
import { Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import LoginSecurity from './LoginSecurity';
import OrderHistory from './OrderHistory';
import EmailSMSPreferences from './EmailSMSPreferences';
import './AccountPage.css';

const AccountPage = () => {
  const [selectedSection, setSelectedSection] = useState('Login & Security');

  const renderSection = () => {
    switch (selectedSection) {
      case 'Login & Security':
        return <LoginSecurity />;
      case 'Order Details':
        return <OrderHistory />;
      case 'Email & SMS Preferences':
        return <EmailSMSPreferences />;
      default:
        return <LoginSecurity />;
    }
  };

  return (
    <div className="account-page-container">
      <div className="sidebar">
        <Typography variant="h5" className="sidebar-header">My Account</Typography>
        <List component="nav">
          <ListItem
            button
            selected={selectedSection === 'Login & Security'}
            onClick={() => setSelectedSection('Login & Security')}
          >
            <ListItemText primary="Login & Security" />
          </ListItem>
          <Divider />
          <ListItem
            button
            selected={selectedSection === 'Order Details'}
            onClick={() => setSelectedSection('Order Details')}
          >
            <ListItemText primary="Order Details" />
          </ListItem>
          <Divider />
          <ListItem
            button
            selected={selectedSection === 'Email & SMS Preferences'}
            onClick={() => setSelectedSection('Email & SMS Preferences')}
          >
            <ListItemText primary="Email & SMS Preferences" />
          </ListItem>
        </List>
      </div>
      <div className="content">{renderSection()}</div>
    </div>
  );
};

export default AccountPage;
