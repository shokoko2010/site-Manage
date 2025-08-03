// components/NewPostView.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useAuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const NewPostView: React.FC = () => {
  const { team } = useAuthContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (team) {
      setSaving(true);
      try {
        await addDoc(collection(db, "posts"), {
          teamId: team.id,
          title,
          content,
          status: 'Draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        navigate('/content-library');
      } catch (error) {
        console.error("Error saving post: ", error);
        alert("An error occurred while saving the post.");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        New Post
      </Typography>
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        variant="outlined"
        multiline
        rows={10}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleSave} disabled={saving}>
        {saving ? <CircularProgress size={24} /> : 'Save Draft'}
      </Button>
    </Box>
  );
};

export default NewPostView;
