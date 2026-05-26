# DevPulse — Internal Tech Issue & Feature Tracker

A collaborative backend platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Live URL
https://devpulse-nine-swart.vercel.app

## Features
- JWT-based authentication (signup / login)
- Role-based access control (contributor / maintainer)
- Full CRUD for issues (bug reports & feature requests)
- Filter & sort issues by type, status, date
- Secure password hashing with bcrypt
- Modular Express architecture with TypeScript

## Tech Stack
| Tech | Purpose |

| Node.js (LTS) | Runtime |
| TypeScript | Type safety |
| Express.js | HTTP framework |
| PostgreSQL | Database (NeonDB) |
| pg (native) | Raw SQL queries |
| bcrypt | Password hashing |
| jsonwebtoken | JWT auth |
| http-status-codes | Status code constants |

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/tamim1317/devpulse
cd devpulse

# 2. Install dependencies
npm install

# 3. Copy env file and fill in values
cp .env.example .env

# 4. Run the database schema on NeonDB SQL Editor
# paste schema.sql content and run

# 5. Start development server
npm run dev
```

## Environment Variables
PORT=5000
DATABASE_URL=postgresql://user:password@host/devpulse
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
NODE_ENV=production

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |

| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get JWT |

### Issues
| Method | Endpoint | Access | Description |

| POST | `/api/issues` | Authenticated | Create issue |
| GET | `/api/issues` | Public | Get all issues |
| GET | `/api/issues/:id` | Public | Get single issue |
| PATCH | `/api/issues/:id` | Authenticated | Update issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete issue |

### Query Parameters for GET /api/issues
| Param | Values | Default |

| sort | newest, oldest | newest |
| type | bug, feature_request | — |
| status | open, in_progress, resolved | — |

## Database Schema

### users
| Column | Type | Notes |

| id | SERIAL | Primary key |
| name | VARCHAR(255) | Required |
| email | VARCHAR(255) | Unique, required |
| password | TEXT | Hashed, never returned |
| role | VARCHAR(20) | contributor / maintainer |
| created_at | TIMESTAMPTZ | Auto-generated |
| updated_at | TIMESTAMPTZ | Auto-updated |

### issues
| Column | Type | Notes |

| id | SERIAL | Primary key |
| title | VARCHAR(150) | Required, max 150 chars |
| description | TEXT | Required, min 20 chars |
| type | VARCHAR(30) | bug / feature_request |
| status | VARCHAR(20) | open / in_progress / resolved |
| reporter_id | INTEGER | References users.id |
| created_at | TIMESTAMPTZ | Auto-generated |
| updated_at | TIMESTAMPTZ | Auto-updated |

## User Roles
| Role | Permissions |

| contributor | Register, login, create issues, view all issues, update own open issues |
| maintainer | All contributor permissions + update any issue, delete any issue, change status |