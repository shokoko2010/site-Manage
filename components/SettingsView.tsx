// components/SettingsView.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, CircularProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { useAuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { Delete as DeleteIcon } from '@mui/icons-material';
import ProtectedComponent from './common/ProtectedComponent';


const SettingsView: React.FC = () => {
  const { user, team } = useAuthContext();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteUser, setNewSiteUser] = useState('');
  const [newSitePassword, setNewSitePassword] = useState('');

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setDisplayName(userData.displayName);
        }
      };
      fetchUserData();
    }
  }, [user]);
  
  useEffect(() => {
    if (team) {
      const fetchSites = async () => {
        const sitesQuery = query(collection(db, "sites"), where("teamId", "==", team.id));
        const sitesSnapshot = await getDocs(sitesQuery);
        setSites(sitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchSites();
    }
    setLoading(false);
  }, [team]);

  const handleProfileSave = async () => {
    if (user) {
      setSaving(true);
      const docRef = doc(db, "users", user.uid);
      try {
        await updateDoc(docRef, { displayName });
        alert("Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile: ", error);
        alert("An error occurred while updating your profile.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAddSite = async () => {
    if (team) {
      try {
        await addDoc(collection(db, "sites"), {
          teamId: team.id,
          name: newSiteName,
          url: newSiteUrl,
          user: newSiteUser,
          password: newSitePassword, // Note: Storing passwords directly is not recommended. Use a secure vault for production.
        });
        setNewSiteName('');
        setNewSiteUrl('');
        setNewSiteUser('');
        setNewSitePassword('');
        // Refresh sites
        const sitesQuery = query(collection(db, "sites"), where("teamId", "==", team.id));
        const sitesSnapshot = await getDocs(sitesQuery);
        setSites(sitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error adding site: ", error);
        alert("An error occurred while adding the site.");
      }
    }
  };
  
  const handleDeleteSite = async (siteId: string) => {
    try {
      await deleteDoc(doc(db, "sites", siteId));
      setSites(sites.filter(site => site.id !== siteId));
    } catch (error) {
      console.error("Error deleting site: ", error);
      alert("An error occurred while deleting the site.");
    }
  };


  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}> as any
 <Typography variant="h6" gutterBottom>
              User Profile
            </Typography>
            <TextField
              fullWidth
              label="Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              value={user?.email || ''}
              variant="outlined"
              sx={{ mb: 2 }}
              disabled
            />
            <Button variant="contained" onClick={handleProfileSave} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Save Profile'}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <ProtectedComponent allowedRoles={['Admin', 'Editor']}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Manage Sites
              </Typography>
              <List>
                {sites.map(site => (
                  <ListItem key={site.id} secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteSite(site.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                    <ListItemText primary={site.name} secondary={site.url} />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Add New Site</Typography>
                  <TextField fullWidth label="Site Name" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} sx={{mb: 1}} />
                  <TextField fullWidth label="WordPress URL" value={newSiteUrl} onChange={e => setNewSiteUrl(e.target.value)} sx={{mb: 1}} />
                  <TextField fullWidth label="WordPress Username" value={newSiteUser} onChange={e => setNewSiteUser(e.target.value)} sx={{mb: 1}} />
                  <TextField fullWidth label="WordPress Application Password" type="password" value={newSitePassword} onChange={e => setNewSitePassword(e.target.value)} sx={{mb: 1}} />
                  <Button variant="contained" onClick={handleAddSite}>Add Site</Button>
              </Box>
            </Paper>
          </ProtectedComponent>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsView;
