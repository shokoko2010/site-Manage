// components/ContentCard.tsx
import React from 'react';
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProtectedComponent from './common/ProtectedComponent';

interface ContentCardProps {
  post: {
    id: string;
    title: string;
    status: string;
    createdAt: any; // Firestore Timestamp
  };
  onDelete: (postId: string) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ post, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    // We'll need to create an EditPostView later
    // For now, this can navigate to a placeholder or the new post view
    navigate(`/edit-post/${post.id}`); 
  };
  
  const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" noWrap>
          {post.title}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          Status: {post.status}
        </Typography>
        <Typography variant="body2">
          Created: {formatDate(post.createdAt)}
        </Typography>
      </CardContent>
      <CardActions>
        <ProtectedComponent allowedRoles={['Admin', 'Editor']}>
          <Button size="small" onClick={handleEdit}>Edit</Button>
          <Button size="small" color="secondary" onClick={() => onDelete(post.id)}>Delete</Button>
        </ProtectedComponent>
      </CardActions>
    </Card>
  );
};

export default ContentCard;
