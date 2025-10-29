# MySQL Database Schema for Work Activity Tracker

This document contains the MySQL schema for your backend integration.

## Tables

### 1. Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

### 2. Projects Table
```sql
CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

### 3. Tags Table
```sql
CREATE TABLE tags (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

### 4. Activities Table
```sql
CREATE TABLE activities (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  duration BIGINT NOT NULL COMMENT 'Duration in milliseconds',
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  project_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_start_time (start_time)
);
```

### 5. Activity Tags Junction Table
```sql
CREATE TABLE activity_tags (
  activity_id VARCHAR(36) NOT NULL,
  tag_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (activity_id, tag_id),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_activity_id (activity_id),
  INDEX idx_tag_id (tag_id)
);
```

## API Endpoints You'll Need

Your backend should implement these endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Projects
- `GET /api/projects` - Get all projects for logged-in user
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tags
- `GET /api/tags` - Get all tags for logged-in user
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Activities
- `GET /api/activities` - Get activities for logged-in user (with optional date filters)
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `GET /api/activities/stats` - Get statistics (total duration, by project, by tag, etc.)

## Notes

1. **UUIDs**: All `id` fields use VARCHAR(36) to store UUIDs (generated client-side using `crypto.randomUUID()`)

2. **Colors**: Stored as hex color codes (e.g., "#ef4444")

3. **Duration**: Stored in milliseconds as BIGINT

4. **Many-to-Many**: Activities can have multiple tags, handled through the `activity_tags` junction table

5. **Soft Delete**: Consider adding a `deleted_at` column if you want soft deletes instead of hard deletes

6. **Indexes**: Added indexes on foreign keys and commonly queried fields for better performance

7. **Security**: Make sure to implement proper authentication and ensure users can only access their own data
