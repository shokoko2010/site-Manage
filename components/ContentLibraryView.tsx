// components/ContentLibraryView.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { useAuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import ContentCard from './ContentCard';

const ContentLibraryView: React.FC = () => {
  const { team } = useAuthContext();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (team) {
      const fetchPosts = async () => {
        const postsQuery = query(collection(db, "posts"), where("teamId", "==", team.id));
        const postsSnapshot = await getDocs(postsQuery);
        setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      };
      fetchPosts();
    } else {
        setLoading(false);
    }
  }, [team]);

  const handleDelete = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
      alert("An error occurred while deleting the post.");
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Content Library
      </Typography>
      <Grid container spacing={3}>
        {posts.map(post => (
          <Grid item key={post.id} xs={12} sm={6} md={4}>
            <ContentCard post={post} onDelete={() => handleDelete(post.id)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentLibraryView;
