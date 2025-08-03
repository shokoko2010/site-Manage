// components/TeamView.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Select, MenuItem } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, doc, query, where, serverTimestamp, arrayUnion, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Team {
  id: string;
  name: string;
  owner: string;
  members: string[];
  roles: { [key: string]: 'Admin' | 'Editor' | 'Viewer' };
}

interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
}

const TeamView: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingInvite, setSendingInvite] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await checkAndCreateTeam(currentUser);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchTeamData = async (user: User) => {
        const teamsQuery = query(collection(db, "teams"), where("members", "array-contains", user.uid));
        const teamsSnapshot = await getDocs(teamsQuery);

        if (!teamsSnapshot.empty) {
            const teamDoc = teamsSnapshot.docs[0];
            const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;
            setTeam(teamData);

            if (teamData.members && teamData.members.length > 0) {
                const memberDetailsPromises = teamData.members.map(async (memberId) => {
                    const userDocRef = doc(db, "users", memberId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        return { uid: userDocSnap.id, ...userDocSnap.data() } as TeamMember;
                    }
                    return null;
                });
                const membersData = (await Promise.all(memberDetailsPromises)).filter(Boolean) as TeamMember[];
                setTeamMembers(membersData);
            }
        }
        return teamsSnapshot;
    };

    const checkAndCreateTeam = async (currentUser: User) => {
        setLoading(true);
        const teamsSnapshot = await fetchTeamData(currentUser);
        if (teamsSnapshot.empty) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            const displayName = userDocSnap.exists() ? userDocSnap.data().displayName : currentUser.email;

            const newTeam: Omit<Team, 'id'> = {
                name: `${displayName}'s Team`,
                owner: currentUser.uid,
                members: [currentUser.uid],
                roles: { [currentUser.uid]: 'Admin' },
            };
            const docRef = await addDoc(collection(db, "teams"), { ...newTeam, createdAt: serverTimestamp() });
            setTeam({ id: docRef.id, ...newTeam });
            setTeamMembers([{ uid: currentUser.uid, displayName: displayName || "", email: currentUser.email || "" }]);
        }
        setLoading(false);
    };
    
    const handleInviteMember = async () => {
        if (!team || !inviteEmail) return;
        setSendingInvite(true);
        
        const usersQuery = query(collection(db, "users"), where("email", "==", inviteEmail));
        const userSnapshot = await getDocs(usersQuery);
        
        if (!userSnapshot.empty) {
            const invitedUser = userSnapshot.docs[0];
            const teamRef = doc(db, "teams", team.id);
            
            await updateDoc(teamRef, {
                members: arrayUnion(invitedUser.id),
                [`roles.${invitedUser.id}`]: 'Viewer'
            });
            setTeamMembers([...teamMembers, { uid: invitedUser.id, ...(invitedUser.data() as Omit<TeamMember, 'uid'>) }]);
            setInviteEmail('');
        } else {
            alert("User not found.");
        }
        setSendingInvite(false);
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {team ? team.name : 'Team Management'}
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
                 <Typography variant="h6" gutterBottom>
                    Invite Team Member
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        sx={{ mr: 2 }}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleInviteMember} disabled={sendingInvite}>
                        {sendingInvite ? <CircularProgress size={24} /> : 'Invite'}
                    </Button>
                </Box>
            </Paper>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teamMembers.map((member) => (
                            <TableRow key={member.uid}>
                                <TableCell>{member.displayName}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                    <Select value={team?.roles[member.uid] || 'Viewer'} variant="standard" disabled={team?.owner !== user?.uid}>
                                        <MenuItem value="Admin">Admin</MenuItem>
                                        <MenuItem value="Editor">Editor</MenuItem>
                                        <MenuItem value="Viewer">Viewer</MenuItem>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    {team?.owner === user?.uid && member.uid !== user?.uid && (
                                        <Button variant="outlined" color="secondary" size="small">
                                            Remove
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default TeamView;
