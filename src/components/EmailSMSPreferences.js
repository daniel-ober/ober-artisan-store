import React, { useState } from 'react';
import {
  Typography,
  Checkbox,
  FormControlLabel,
  Grid,
  Button,
} from '@mui/material';

const EmailSMSPreferences = () => {
  const [preferences, setPreferences] = useState({
    emailPromotions: false,
    emailUpdates: false,
    emailReminders: false,
    smsPromotions: false,
    smsUpdates: false,
    smsReminders: false,
  });

  const handlePreferenceChange = (event) => {
    const { name, checked } = event.target;
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      [name]: checked,
    }));
  };

  const handleSaveChanges = () => {
    // Add the logic to save preferences, e.g., update the database.
    // console.log('Saved preferences:', preferences);
    alert('Preferences saved successfully!');
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Email &amp; SMS Preferences
      </Typography>
      <Typography variant="body1" gutterBottom>
        Select the types of notifications you&apos;d like to receive via email and SMS.
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={6}>
          <Typography variant="h6">Email Preferences</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.emailPromotions}
                onChange={handlePreferenceChange}
                name="emailPromotions"
              />
            }
            label="Promotions"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.emailUpdates}
                onChange={handlePreferenceChange}
                name="emailUpdates"
              />
            }
            label="Product Updates"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.emailReminders}
                onChange={handlePreferenceChange}
                name="emailReminders"
              />
            }
            label="Reminders"
          />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6">SMS Preferences</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.smsPromotions}
                onChange={handlePreferenceChange}
                name="smsPromotions"
              />
            }
            label="Promotions"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.smsUpdates}
                onChange={handlePreferenceChange}
                name="smsUpdates"
              />
            }
            label="Product Updates"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.smsReminders}
                onChange={handlePreferenceChange}
                name="smsReminders"
              />
            }
            label="Reminders"
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveChanges}
        style={{ marginTop: '20px' }}
      >
        Save Changes
      </Button>
    </div>
  );
};

export default EmailSMSPreferences;
