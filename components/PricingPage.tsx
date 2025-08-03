// components/PricingPage.tsx
import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardHeader, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Check } from '@mui/icons-material';

const tiers = [
  {
    title: 'Free',
    price: '0',
    description: [
      '1 user included',
      '1 website included',
      '10 posts per month',
      'Help center access',
    ],
    buttonText: 'Sign up for free',
    buttonVariant: 'outlined',
  },
  {
    title: 'Pro',
    price: '15',
    description: [
      '5 users included',
      '5 websites included',
      '100 posts per month',
      'Priority email support',
    ],
    buttonText: 'Get started',
    buttonVariant: 'contained',
  },
  {
    title: 'Enterprise',
    price: '30',
    description: [
      'Unlimited users',
      'Unlimited websites',
      'Unlimited posts',
      'Phone & email support',
    ],
    buttonText: 'Contact us',
    buttonVariant: 'outlined',
  },
];

const PricingPage: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" align="center" gutterBottom>
        Pricing
      </Typography>
      <Typography variant="h5" align="center" color="text.secondary" component="p" gutterBottom>
        Quickly build an effective pricing table for your potential customers with this layout.
      </Typography>
      <Grid container spacing={5} alignItems="flex-end" sx={{ mt: 4 }}>
        {tiers.map((tier) => (
          <Grid
            item key={tier.title}
            xs={12}
            sm={tiers.title === 'Enterprise' ? 12 : 6}
            md={4}
          >
            <Card>
              <CardHeader
                title={tier.title}
                titleTypographyProps={{ align: 'center' }}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                      ? theme.palette.grey[200]
                      : theme.palette.grey[700],
                }}
              />
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    mb: 2,
                  }}
                >
                  <Typography component="h2" variant="h3" color="text.primary">
                    ${tier.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    /mo
                  </Typography>
                </Box>
                <List>
                  {tier.description.map((line) => (
                    <ListItem key={line}>
                      <ListItemIcon>
                        <Check />
                      </ListItemIcon>
                      <ListItemText primary={line} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <Button fullWidth variant={tier.buttonVariant as 'outlined' | 'contained'}>
                {tier.buttonText}
              </Button>
            </Card>
          </Grid> 
        ))}
      </Grid>
    </Box>
 );
};

export default PricingPage;