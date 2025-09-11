from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
import pandas as pd
import json
import io

from ..models.analytics import DocumentAnalytics, UserActivity, SystemMetrics
from ..utils.logger import get_logger

logger = get_logger(__name__)

class ReportingService:
    def __init__(self, db: Session):
        self.db = db

    def generate_compliance_report(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        format: str = "json"
    ) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        try:
            # Get document analytics for the period
            documents = self.db.query(DocumentAnalytics).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).all()

            # Get user activity for the period
            activities = self.db.query(UserActivity).filter(
                and_(
                    UserActivity.tenant_id == tenant_id,
                    UserActivity.timestamp >= start_date,
                    UserActivity.timestamp <= end_date
                )
            ).all()

            # Calculate compliance metrics
            total_documents = len(documents)
            acknowledged_documents = sum(1 for doc in documents if doc.acknowledgments > 0)
            compliance_rate = (acknowledged_documents / total_documents * 100) if total_documents > 0 else 0

            # Get compliance by category
            category_compliance = {}
            for doc in documents:
                category = doc.category
                if category not in category_compliance:
                    category_compliance[category] = {
                        "total": 0,
                        "acknowledged": 0,
                        "compliance_rate": 0
                    }
                
                category_compliance[category]["total"] += 1
                if doc.acknowledgments > 0:
                    category_compliance[category]["acknowledged"] += 1

            # Calculate compliance rate for each category
            for category in category_compliance:
                total = category_compliance[category]["total"]
                acknowledged = category_compliance[category]["acknowledged"]
                category_compliance[category]["compliance_rate"] = (
                    acknowledged / total * 100
                ) if total > 0 else 0

            # Get user engagement metrics
            active_users = len(set(activity.user_id for activity in activities))
            total_actions = len(activities)
            avg_actions_per_user = total_actions / active_users if active_users > 0 else 0

            # Generate report
            report = {
                "report_type": "compliance",
                "tenant_id": tenant_id,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "duration_days": (end_date - start_date).days
                },
                "overview": {
                    "total_documents": total_documents,
                    "acknowledged_documents": acknowledged_documents,
                    "compliance_rate": round(compliance_rate, 2),
                    "active_users": active_users,
                    "total_actions": total_actions,
                    "avg_actions_per_user": round(avg_actions_per_user, 2)
                },
                "category_compliance": category_compliance,
                "generated_at": datetime.utcnow().isoformat()
            }

            if format == "csv":
                return self._convert_to_csv(report)
            elif format == "excel":
                return self._convert_to_excel(report)
            else:
                return report

        except Exception as e:
            logger.error(f"Error generating compliance report: {str(e)}")
            raise

    def generate_risk_assessment_report(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate risk assessment report"""
        try:
            # Get documents with risk levels
            documents = self.db.query(DocumentAnalytics).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).all()

            # Calculate risk distribution
            risk_distribution = {}
            for doc in documents:
                risk_level = doc.risk_level or 1
                if risk_level not in risk_distribution:
                    risk_distribution[risk_level] = 0
                risk_distribution[risk_level] += 1

            # Calculate average risk score
            total_risk_score = sum(doc.risk_level or 1 for doc in documents)
            avg_risk_score = total_risk_score / len(documents) if documents else 0

            # Get high-risk documents
            high_risk_docs = [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category,
                    "risk_level": doc.risk_level,
                    "created_at": doc.created_at.isoformat()
                }
                for doc in documents
                if (doc.risk_level or 1) >= 4
            ]

            # Generate risk report
            report = {
                "report_type": "risk_assessment",
                "tenant_id": tenant_id,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "risk_overview": {
                    "total_documents": len(documents),
                    "average_risk_score": round(avg_risk_score, 2),
                    "high_risk_documents": len(high_risk_docs)
                },
                "risk_distribution": risk_distribution,
                "high_risk_documents": high_risk_docs,
                "generated_at": datetime.utcnow().isoformat()
            }

            return report

        except Exception as e:
            logger.error(f"Error generating risk assessment report: {str(e)}")
            raise

    def generate_user_activity_report(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate user activity report"""
        try:
            # Get user activities
            activities = self.db.query(UserActivity).filter(
                and_(
                    UserActivity.tenant_id == tenant_id,
                    UserActivity.timestamp >= start_date,
                    UserActivity.timestamp <= end_date
                )
            ).all()

            # Group activities by user
            user_activities = {}
            for activity in activities:
                user_id = activity.user_id
                if user_id not in user_activities:
                    user_activities[user_id] = {
                        "total_actions": 0,
                        "action_types": {},
                        "last_activity": None,
                        "sessions": set()
                    }
                
                user_activities[user_id]["total_actions"] += 1
                
                # Count action types
                action_type = activity.action
                if action_type not in user_activities[user_id]["action_types"]:
                    user_activities[user_id]["action_types"][action_type] = 0
                user_activities[user_id]["action_types"][action_type] += 1
                
                # Track last activity
                if (user_activities[user_id]["last_activity"] is None or 
                    activity.timestamp > user_activities[user_id]["last_activity"]):
                    user_activities[user_id]["last_activity"] = activity.timestamp
                
                # Track sessions
                if activity.session_id:
                    user_activities[user_id]["sessions"].add(activity.session_id)

            # Convert sets to counts for JSON serialization
            for user_id in user_activities:
                user_activities[user_id]["sessions"] = len(user_activities[user_id]["sessions"])
                if user_activities[user_id]["last_activity"]:
                    user_activities[user_id]["last_activity"] = user_activities[user_id]["last_activity"].isoformat()

            # Calculate summary statistics
            total_users = len(user_activities)
            total_actions = sum(user["total_actions"] for user in user_activities.values())
            avg_actions_per_user = total_actions / total_users if total_users > 0 else 0

            # Generate report
            report = {
                "report_type": "user_activity",
                "tenant_id": tenant_id,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "summary": {
                    "total_users": total_users,
                    "total_actions": total_actions,
                    "average_actions_per_user": round(avg_actions_per_user, 2)
                },
                "user_activities": user_activities,
                "generated_at": datetime.utcnow().isoformat()
            }

            return report

        except Exception as e:
            logger.error(f"Error generating user activity report: {str(e)}")
            raise

    def generate_trend_analysis_report(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        interval: str = "daily"
    ) -> Dict[str, Any]:
        """Generate trend analysis report"""
        try:
            # Get documents over time
            documents = self.db.query(DocumentAnalytics).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).order_by(DocumentAnalytics.created_at).all()

            # Group by time interval
            trends = {}
            for doc in documents:
                if interval == "daily":
                    key = doc.created_at.date().isoformat()
                elif interval == "weekly":
                    key = doc.created_at.isocalendar()[1]  # Week number
                elif interval == "monthly":
                    key = doc.created_at.strftime("%Y-%m")
                else:
                    key = doc.created_at.date().isoformat()

                if key not in trends:
                    trends[key] = {
                        "documents_created": 0,
                        "total_downloads": 0,
                        "total_acknowledgments": 0,
                        "avg_rating": 0,
                        "total_ratings": 0
                    }
                
                trends[key]["documents_created"] += 1
                trends[key]["total_downloads"] += doc.downloads or 0
                trends[key]["total_acknowledgments"] += doc.acknowledgments or 0
                
                if doc.rating:
                    trends[key]["total_ratings"] += 1
                    trends[key]["avg_rating"] = (
                        (trends[key]["avg_rating"] * (trends[key]["total_ratings"] - 1) + doc.rating) /
                        trends[key]["total_ratings"]
                    )

            # Convert to sorted list
            trends_list = [
                {
                    "period": key,
                    **values
                }
                for key, values in sorted(trends.items())
            ]

            # Generate report
            report = {
                "report_type": "trend_analysis",
                "tenant_id": tenant_id,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "interval": interval
                },
                "trends": trends_list,
                "generated_at": datetime.utcnow().isoformat()
            }

            return report

        except Exception as e:
            logger.error(f"Error generating trend analysis report: {str(e)}")
            raise

    def _convert_to_csv(self, report: Dict[str, Any]) -> str:
        """Convert report to CSV format"""
        try:
            # Flatten the report structure for CSV
            csv_data = []
            
            # Add overview data
            for key, value in report["overview"].items():
                csv_data.append([key, value])
            
            csv_data.append([])  # Empty row
            
            # Add category compliance data
            csv_data.append(["Category", "Total", "Acknowledged", "Compliance Rate"])
            for category, data in report["category_compliance"].items():
                csv_data.append([
                    category,
                    data["total"],
                    data["acknowledged"],
                    f"{data['compliance_rate']:.2f}%"
                ])

            # Convert to CSV string
            output = io.StringIO()
            for row in csv_data:
                output.write(",".join(str(cell) for cell in row) + "\n")
            
            return output.getvalue()

        except Exception as e:
            logger.error(f"Error converting report to CSV: {str(e)}")
            raise

    def _convert_to_excel(self, report: Dict[str, Any]) -> bytes:
        """Convert report to Excel format"""
        try:
            # Create DataFrame for overview
            overview_data = []
            for key, value in report["overview"].items():
                overview_data.append({"Metric": key, "Value": value})
            
            overview_df = pd.DataFrame(overview_data)
            
            # Create DataFrame for category compliance
            category_data = []
            for category, data in report["category_compliance"].items():
                category_data.append({
                    "Category": category,
                    "Total": data["total"],
                    "Acknowledged": data["acknowledged"],
                    "Compliance Rate": f"{data['compliance_rate']:.2f}%"
                })
            
            category_df = pd.DataFrame(category_data)
            
            # Create Excel file
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                overview_df.to_excel(writer, sheet_name='Overview', index=False)
                category_df.to_excel(writer, sheet_name='Category Compliance', index=False)
            
            output.seek(0)
            return output.getvalue()

        except Exception as e:
            logger.error(f"Error converting report to Excel: {str(e)}")
            raise
