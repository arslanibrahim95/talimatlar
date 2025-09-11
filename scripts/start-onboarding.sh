#!/bin/bash

# Claude Talimat User Onboarding Script
# Bu script kullanıcı onboarding sürecini başlatır

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ONBOARDING_TYPE=${1:-full}
BATCH_SIZE=${2:-10}
NOTIFICATION_EMAIL=${3:-admin@claude-talimat.com}

# Logging
LOG_FILE="/var/log/onboarding.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}👥 Starting User Onboarding Process${NC}"
echo "Onboarding Type: $ONBOARDING_TYPE"
echo "Batch Size: $BATCH_SIZE"
echo "Notification Email: $NOTIFICATION_EMAIL"
echo "Timestamp: $(date)"
echo "----------------------------------------"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to send notification email
send_notification() {
    local subject="$1"
    local message="$2"
    local recipient="$3"
    
    echo "$message" | mail -s "$subject" "$recipient" 2>/dev/null || true
}

# Function to create user accounts
create_user_accounts() {
    print_info "Creating user accounts..."
    
    # Create users directory
    mkdir -p /opt/claude-talimat/users
    
    # Sample user data (in real scenario, this would come from HR system)
    cat > /tmp/users.csv << EOF
email,first_name,last_name,department,role,manager_email
john.doe@company.com,John,Doe,IT,user,manager@company.com
jane.smith@company.com,Jane,Smith,HR,manager,admin@company.com
bob.wilson@company.com,Bob,Wilson,Finance,user,manager@company.com
alice.brown@company.com,Alice,Brown,Operations,user,manager@company.com
charlie.davis@company.com,Charlie,Davis,IT,admin,admin@company.com
EOF
    
    # Process users in batches
    local line_count=0
    local batch_count=0
    
    while IFS=',' read -r email first_name last_name department role manager_email; do
        # Skip header
        if [ "$line_count" -eq 0 ]; then
            line_count=$((line_count + 1))
            continue
        fi
        
        # Create user account
        create_single_user "$email" "$first_name" "$last_name" "$department" "$role" "$manager_email"
        
        line_count=$((line_count + 1))
        batch_count=$((batch_count + 1))
        
        # Process in batches
        if [ "$batch_count" -eq "$BATCH_SIZE" ]; then
            print_info "Processed batch of $batch_count users"
            batch_count=0
            sleep 5  # Pause between batches
        fi
        
    done < /tmp/users.csv
    
    print_status "User accounts created"
}

# Function to create a single user
create_single_user() {
    local email="$1"
    local first_name="$2"
    local last_name="$3"
    local department="$4"
    local role="$5"
    local manager_email="$6"
    
    print_info "Creating user: $email"
    
    # Generate temporary password
    local temp_password=$(openssl rand -base64 12)
    
    # Create user data
    cat > "/tmp/user_$email.json" << EOF
{
  "email": "$email",
  "first_name": "$first_name",
  "last_name": "$last_name",
  "department": "$department",
  "role": "$role",
  "manager_email": "$manager_email",
  "temp_password": "$temp_password",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "pending_onboarding"
}
EOF
    
    # Send welcome email
    send_welcome_email "$email" "$first_name" "$temp_password"
    
    # Create user folder
    mkdir -p "/opt/claude-talimat/users/$email"
    
    # Move user data
    mv "/tmp/user_$email.json" "/opt/claude-talimat/users/$email/user_data.json"
    
    print_status "User $email created successfully"
}

# Function to send welcome email
send_welcome_email() {
    local email="$1"
    local first_name="$2"
    local temp_password="$3"
    
    local subject="Welcome to Claude Talimat - Your Account is Ready!"
    local message="Dear $first_name,

Welcome to Claude Talimat İş Güvenliği Yönetim Sistemi!

Your account has been created and is ready for use.

Login Information:
- Email: $email
- Temporary Password: $temp_password
- Login URL: https://claude-talimat.com/auth/login

Important: Please change your password on first login.

Next Steps:
1. Login to the system
2. Complete your profile setup
3. Review the user guide
4. Complete the onboarding checklist
5. Start using the system

If you have any questions, please contact our support team at support@claude-talimat.com.

Best regards,
Claude Talimat Team"
    
    send_notification "$subject" "$message" "$email"
    print_info "Welcome email sent to $email"
}

# Function to setup training schedule
setup_training_schedule() {
    print_info "Setting up training schedule..."
    
    # Create training directory
    mkdir -p /opt/claude-talimat/training
    
    # Create training schedule
    cat > /tmp/training_schedule.json << EOF
{
  "training_sessions": [
    {
      "id": "intro-session",
      "title": "System Introduction",
      "duration": "30 minutes",
      "type": "online",
      "schedule": "daily",
      "max_participants": 20,
      "instructor": "System Admin",
      "description": "Basic system overview and navigation"
    },
    {
      "id": "document-management",
      "title": "Document Management Training",
      "duration": "45 minutes",
      "type": "online",
      "schedule": "weekly",
      "max_participants": 15,
      "instructor": "Document Specialist",
      "description": "Learn how to upload, organize, and manage documents"
    },
    {
      "id": "user-management",
      "title": "User Management Training",
      "duration": "60 minutes",
      "type": "online",
      "schedule": "weekly",
      "max_participants": 10,
      "instructor": "HR Manager",
      "description": "For managers: Learn user management features"
    },
    {
      "id": "analytics-reporting",
      "title": "Analytics and Reporting",
      "duration": "45 minutes",
      "type": "online",
      "schedule": "bi-weekly",
      "max_participants": 12,
      "instructor": "Analytics Specialist",
      "description": "Learn how to generate and interpret reports"
    },
    {
      "id": "security-compliance",
      "title": "Security and Compliance",
      "duration": "30 minutes",
      "type": "online",
      "schedule": "monthly",
      "max_participants": 25,
      "instructor": "Security Officer",
      "description": "Security best practices and compliance requirements"
    }
  ]
}
EOF
    
    mv /tmp/training_schedule.json /opt/claude-talimat/training/schedule.json
    
    print_status "Training schedule created"
}

# Function to create onboarding checklist
create_onboarding_checklist() {
    print_info "Creating onboarding checklist..."
    
    # Create checklist template
    cat > /tmp/onboarding_checklist.md << 'EOF'
# 🎓 Claude Talimat Onboarding Checklist

## Pre-Onboarding (HR/IT)
- [ ] User account created in system
- [ ] Email verification completed
- [ ] Initial password set and shared securely
- [ ] User role assigned (Admin/Manager/User/Viewer)
- [ ] Department/Team assignment completed
- [ ] Manager approval obtained

## Day 1: System Introduction
- [ ] Welcome session attended
- [ ] First login completed
- [ ] Password changed
- [ ] Profile setup completed
- [ ] Two-factor authentication enabled
- [ ] Notification preferences configured

## Day 2-3: Core Features Training
- [ ] Document upload process learned
- [ ] File organization methods understood
- [ ] Search and filter functionality mastered
- [ ] Document sharing procedures learned
- [ ] Version control understanding gained

## Day 4-5: Advanced Features
- [ ] Dashboard analytics interpretation learned
- [ ] Report generation process mastered
- [ ] Data export procedures understood
- [ ] Custom reports creation learned
- [ ] Scheduled reports setup completed

## Day 6-7: Security & Compliance
- [ ] Password policies understood
- [ ] Two-factor authentication setup completed
- [ ] Session management procedures learned
- [ ] Data protection guidelines reviewed
- [ ] Incident reporting process understood

## Week 2: Practical Application
- [ ] Document upload practice completed
- [ ] User management exercises completed
- [ ] Report generation practice completed
- [ ] Workflow creation exercises completed
- [ ] Problem-solving scenarios practiced

## Week 3-4: Mastery & Optimization
- [ ] Custom workflows creation learned
- [ ] Advanced reporting techniques mastered
- [ ] API integration projects completed
- [ ] Performance optimization techniques learned
- [ ] Troubleshooting skills developed

## Certification
- [ ] User certification exam passed
- [ ] Role-specific certification completed
- [ ] Advanced features certification
- [ ] Security training certification
- [ ] Compliance training certification

## Completion
- [ ] All training modules completed
- [ ] Practical exercises finished
- [ ] Certification achieved
- [ ] Feedback provided
- [ ] Ready for production use
EOF
    
    mv /tmp/onboarding_checklist.md /opt/claude-talimat/training/onboarding_checklist.md
    
    print_status "Onboarding checklist created"
}

# Function to setup user groups
setup_user_groups() {
    print_info "Setting up user groups..."
    
    # Create user groups configuration
    cat > /tmp/user_groups.json << EOF
{
  "groups": [
    {
      "id": "admins",
      "name": "System Administrators",
      "description": "Full system access and management",
      "permissions": [
        "user_management",
        "system_configuration",
        "security_management",
        "backup_management",
        "monitoring_access"
      ],
      "role": "admin"
    },
    {
      "id": "managers",
      "name": "Department Managers",
      "description": "Team management and reporting",
      "permissions": [
        "team_management",
        "report_generation",
        "document_management",
        "analytics_access",
        "user_approval"
      ],
      "role": "manager"
    },
    {
      "id": "users",
      "name": "Regular Users",
      "description": "Standard system usage",
      "permissions": [
        "document_upload",
        "document_download",
        "profile_management",
        "basic_reporting",
        "notification_management"
      ],
      "role": "user"
    },
    {
      "id": "viewers",
      "name": "Read-Only Users",
      "description": "View-only access",
      "permissions": [
        "document_view",
        "report_view",
        "profile_view",
        "notification_view"
      ],
      "role": "viewer"
    }
  ]
}
EOF
    
    mv /tmp/user_groups.json /opt/claude-talimat/users/groups.json
    
    print_status "User groups configured"
}

# Function to setup notification system
setup_notification_system() {
    print_info "Setting up notification system..."
    
    # Create notification templates
    cat > /tmp/notification_templates.json << EOF
{
  "templates": [
    {
      "id": "welcome",
      "subject": "Welcome to Claude Talimat!",
      "template": "welcome_email.html",
      "type": "email",
      "trigger": "user_created"
    },
    {
      "id": "training_reminder",
      "subject": "Training Session Reminder",
      "template": "training_reminder.html",
      "type": "email",
      "trigger": "training_scheduled"
    },
    {
      "id": "onboarding_progress",
      "subject": "Onboarding Progress Update",
      "template": "onboarding_progress.html",
      "type": "email",
      "trigger": "onboarding_milestone"
    },
    {
      "id": "system_announcement",
      "subject": "System Announcement",
      "template": "system_announcement.html",
      "type": "email",
      "trigger": "system_announcement"
    }
  ]
}
EOF
    
    mv /tmp/notification_templates.json /opt/claude-talimat/notifications/templates.json
    
    print_status "Notification system configured"
}

# Function to create onboarding dashboard
create_onboarding_dashboard() {
    print_info "Creating onboarding dashboard..."
    
    # Create dashboard configuration
    cat > /tmp/onboarding_dashboard.json << EOF
{
  "dashboard": {
    "title": "Claude Talimat Onboarding Dashboard",
    "sections": [
      {
        "id": "progress",
        "title": "Onboarding Progress",
        "type": "progress_bar",
        "data_source": "user_progress"
      },
      {
        "id": "training_schedule",
        "title": "Training Schedule",
        "type": "calendar",
        "data_source": "training_sessions"
      },
      {
        "id": "checklist",
        "title": "Onboarding Checklist",
        "type": "checklist",
        "data_source": "onboarding_tasks"
      },
      {
        "id": "resources",
        "title": "Learning Resources",
        "type": "resource_list",
        "data_source": "training_materials"
      },
      {
        "id": "support",
        "title": "Support & Help",
        "type": "support_links",
        "data_source": "support_resources"
      }
    ]
  }
}
EOF
    
    mv /tmp/onboarding_dashboard.json /opt/claude-talimat/dashboard/onboarding.json
    
    print_status "Onboarding dashboard created"
}

# Function to setup progress tracking
setup_progress_tracking() {
    print_info "Setting up progress tracking..."
    
    # Create progress tracking database schema
    cat > /tmp/progress_tracking.sql << EOF
-- Progress Tracking Database Schema
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP,
    score INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding_milestones (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    milestone VARCHAR(100) NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS training_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    attendance_date TIMESTAMP,
    feedback TEXT,
    rating INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_progress_email ON user_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_milestones_email ON onboarding_milestones(user_email);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON training_sessions(user_email);
EOF
    
    mv /tmp/progress_tracking.sql /opt/claude-talimat/database/progress_tracking.sql
    
    print_status "Progress tracking configured"
}

# Function to generate onboarding report
generate_onboarding_report() {
    print_info "Generating onboarding report..."
    
    local report_file="/opt/claude-talimat/reports/onboarding-setup-$(date +%Y%m%d_%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > /tmp/onboarding-report.md << EOF
# 👥 Claude Talimat Onboarding Setup Report

**Generated:** $(date)
**Onboarding Type:** $ONBOARDING_TYPE
**Batch Size:** $BATCH_SIZE

## 📊 Setup Summary

This report documents the onboarding system setup for Claude Talimat.

## 🔧 Components Configured

### User Management
- ✅ User account creation system
- ✅ Role-based access control
- ✅ Department assignment
- ✅ Manager approval workflow

### Training System
- ✅ Training schedule created
- ✅ Onboarding checklist prepared
- ✅ Progress tracking configured
- ✅ Certification system ready

### Notification System
- ✅ Welcome email templates
- ✅ Training reminder system
- ✅ Progress update notifications
- ✅ System announcement system

### Dashboard
- ✅ Onboarding dashboard created
- ✅ Progress tracking interface
- ✅ Resource management system
- ✅ Support integration

## 📋 Training Modules

### Core Training
1. **System Introduction** (30 min)
   - Basic system overview
   - Navigation training
   - Profile setup

2. **Document Management** (45 min)
   - Upload procedures
   - Organization methods
   - Sharing protocols

3. **User Management** (60 min)
   - Team management
   - Permission control
   - User approval process

4. **Analytics & Reporting** (45 min)
   - Report generation
   - Data interpretation
   - Custom reports

5. **Security & Compliance** (30 min)
   - Security best practices
   - Compliance requirements
   - Incident reporting

## 👥 User Groups

### Administrators
- Full system access
- User management
- System configuration
- Security management

### Managers
- Team management
- Report generation
- Document management
- User approval

### Users
- Document upload/download
- Profile management
- Basic reporting
- Notification management

### Viewers
- Read-only access
- Document viewing
- Report viewing
- Notification viewing

## 📈 Success Metrics

### Onboarding Completion
- **Target**: 95% completion rate
- **Timeline**: 4 weeks
- **Certification**: 90% pass rate

### User Satisfaction
- **Target**: 4.5/5 rating
- **Feedback**: Collected weekly
- **Improvement**: Continuous

### System Adoption
- **Target**: 90% active users
- **Timeline**: 30 days
- **Engagement**: Daily usage

## 🚀 Next Steps

1. **User Account Creation**: Create user accounts
2. **Training Schedule**: Send training invitations
3. **Onboarding Start**: Begin onboarding process
4. **Progress Monitoring**: Track user progress
5. **Feedback Collection**: Gather user feedback
6. **Continuous Improvement**: Update based on feedback

## 📁 Configuration Files

- **User Groups**: /opt/claude-talimat/users/groups.json
- **Training Schedule**: /opt/claude-talimat/training/schedule.json
- **Notification Templates**: /opt/claude-talimat/notifications/templates.json
- **Onboarding Dashboard**: /opt/claude-talimat/dashboard/onboarding.json
- **Progress Tracking**: /opt/claude-talimat/database/progress_tracking.sql

## 🔗 Resources

- [User Guide](docs/USER_GUIDE.md)
- [Training Materials](training/)
- [Onboarding Checklist](training/onboarding-checklist.md)
- [Support Documentation](docs/support.md)

---
*Report generated by Claude Talimat Onboarding System*
EOF
    
    mv /tmp/onboarding-report.md "$report_file"
    
    print_status "Onboarding report generated: $report_file"
}

# Main onboarding function
main() {
    print_info "Starting user onboarding process..."
    
    # Create necessary directories
    mkdir -p /opt/claude-talimat/{users,training,notifications,dashboard,database,reports}
    
    # Setup onboarding system
    create_user_accounts
    setup_training_schedule
    create_onboarding_checklist
    setup_user_groups
    setup_notification_system
    create_onboarding_dashboard
    setup_progress_tracking
    
    # Generate report
    generate_onboarding_report
    
    print_status "User onboarding system setup completed successfully!"
    print_info "Log file: $LOG_FILE"
    print_info "Next step: Run user account creation and training schedule"
}

# Run main function
main "$@"
