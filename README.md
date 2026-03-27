🎓 CampusConnect
CampusConnect is a modern web application designed to streamline campus life by allowing students to discover clubs, register for events, and stay updated with live scores and notifications.

🚀 Recent Updates: Supabase Integration
The project has been successfully migrated to Supabase to provide a robust, real-time backend for authentication and data storage.

Key Improvements:
Authentication: Fully integrated Supabase Auth for secure email and password login.

Real-time Session Management: Implemented an AuthContext to track user login status across the entire application.

Event Registration: Fixed the logic to ensure only authenticated users can register for campus events.

🛠️ Tech Stack
Frontend: React.js with TypeScript

Styling: Tailwind CSS & Framer Motion for smooth animations

Icons: Lucide-React

Backend/Database: Supabase

Notifications: Sonner Toast library

⚙️ Setup & Installation
Clone the repository:

Bash
git clone [your-repository-link]
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a supabase.ts file in the src/pages directory with your project credentials:

TypeScript
// src/pages/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpwxsnbmehetomeafmii.supabase.co'; // Your project URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);
Run the application:

Bash
npm run dev
📂 Project Structure
src/pages/: Contains all main view components (Login, Events, Clubs, etc.).

src/contexts/: Contains the AuthContext for global user state.

src/components/: Reusable UI components.

📝 Troubleshooting Note
If you encounter a 404 error or Provider not enabled error during Google/Apple login, ensure that the OAuth providers are correctly configured in your Supabase Dashboard under Authentication > Providers.