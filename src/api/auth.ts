// Mock database for users (in a real app, this would be a real database)
let users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123', // In real app, this would be hashed
    name: 'Admin User',
    role: 'admin' as const,
    plan: 'enterprise' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123', // In real app, this would be hashed
    name: 'Regular User',
    role: 'user' as const,
    plan: 'free' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock JWT token generation (in real app, use a proper JWT library)
const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}`;
};

// Mock JWT verification (in real app, use a proper JWT library)
const verifyToken = (token: string): string | null => {
  if (token.startsWith('token_')) {
    return token.split('_')[1];
  }
  return null;
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authAPI = {
  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = users.find(u => u.email === data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      name: data.name,
      role: 'user',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real app, hash the password before storing
    users.push({
      ...newUser,
      password: data.password,
    });

    const token = generateToken(newUser.id);
    return { token, user: newUser };
  },

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = users.find(u => u.email === data.email && u.password === data.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;
    const token = generateToken(user.id);
    return { token, user: userWithoutPassword };
  },

  // Get user profile
  async getProfile(token: string): Promise<User> {
    const userId = verifyToken(token);
    if (!userId) {
      throw new Error('Invalid token');
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  // Get all users (admin only)
  async getAllUsers(token: string): Promise<User[]> {
    const adminUser = await this.getProfile(token);
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    return users.map(({ password, ...user }) => user);
  },

  // Update user plan (admin only)
  async updateUserPlan(token: string, userId: string, plan: User['plan']): Promise<User> {
    const adminUser = await this.getProfile(token);
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      plan,
      updatedAt: new Date().toISOString(),
    };

    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  },

  // Delete user (admin only)
  async deleteUser(token: string, userId: string): Promise<void> {
    const adminUser = await this.getProfile(token);
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users.splice(userIndex, 1);
  },
};