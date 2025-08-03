// components/EditPostView.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const EditPostView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
        const fetchPost = async () => {
            const docRef = doc(db, "posts", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const postData = docSnap.data();
                setTitle(postData.title);
                setContent(postData.content);
            }
            setLoading(false);
        };
        fetchPost();
    }
  }, [id]);

  const handleUpdate = async () => {
    if (id) {
        setSaving(true);
        try {
            const docRef = doc(db, "posts", id);
            await updateDoc(docRef, {
                title,
                content,
                updatedAt: serverTimestamp(),
            });
            navigate('/content-library');
        } catch (error) {
            console.error("Error updating post: ", error);
            alert("An error occurred while updating the post.");
        } finally {
            setSaving(false);
        }
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Edit Post
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
      <Button variant="contained" onClick={handleUpdate} disabled={saving}>
        {saving ? <CircularProgress size={24} /> : 'Update Post'}
      </Button>
    </Box>
  );
};

export default EditPostView;
