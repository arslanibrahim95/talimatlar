from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import json

from ..models.analytics import DocumentAnalytics, UserActivity, SystemMetrics
from ..utils.logger import get_logger

logger = get_logger(__name__)

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_overview(self, tenant_id: str, time_range: str = "30d") -> Dict[str, Any]:
        """Get dashboard overview with key metrics"""
        try:
            end_date = datetime.utcnow()
            start_date = self._get_start_date(end_date, time_range)
            
            # Get document statistics
            doc_stats = self._get_document_statistics(tenant_id, start_date, end_date)
            
            # Get user activity
            user_stats = self._get_user_statistics(tenant_id, start_date, end_date)
            
            # Get system performance
            system_stats = self._get_system_statistics(tenant_id, start_date, end_date)
            
            # Get compliance metrics
            compliance_stats = self._get_compliance_metrics(tenant_id, start_date, end_date)
            
            return {
                "time_range": time_range,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "documents": doc_stats,
                "users": user_stats,
                "system": system_stats,
                "compliance": compliance_stats,
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard overview: {str(e)}")
            raise

    def get_trend_data(self, tenant_id: str, time_range: str = "30d", metric: str = "documents") -> List[Dict[str, Any]]:
        """Get trend data for specified metric"""
        try:
            end_date = datetime.utcnow()
            start_date = self._get_start_date(end_date, time_range)
            
            if metric == "documents":
                return self._get_document_trends(tenant_id, start_date, end_date)
            elif metric == "users":
                return self._get_user_trends(tenant_id, start_date, end_date)
            elif metric == "downloads":
                return self._get_download_trends(tenant_id, start_date, end_date)
            elif metric == "storage":
                return self._get_storage_trends(tenant_id, start_date, end_date)
            else:
                raise ValueError(f"Unsupported metric: {metric}")
                
        except Exception as e:
            logger.error(f"Error getting trend data: {str(e)}")
            raise

    def get_category_distribution(self, tenant_id: str, time_range: str = "30d") -> List[Dict[str, Any]]:
        """Get document category distribution"""
        try:
            end_date = datetime.utcnow()
            start_date = self._get_start_date(end_date, time_range)
            
            # Get category counts
            category_stats = self.db.query(
                DocumentAnalytics.category,
                func.count(DocumentAnalytics.id).label('count'),
                func.sum(DocumentAnalytics.file_size).label('total_size')
            ).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).group_by(DocumentAnalytics.category).all()
            
            # Calculate percentages
            total_count = sum(stat.count for stat in category_stats)
            
            distribution = []
            for stat in category_stats:
                percentage = round((stat.count / total_count) * 100, 2) if total_count > 0 else 0
                distribution.append({
                    "category": stat.category,
                    "count": stat.count,
                    "percentage": percentage,
                    "total_size_bytes": stat.total_size or 0,
                    "total_size_mb": round((stat.total_size or 0) / (1024 * 1024), 2)
                })
            
            # Sort by count descending
            distribution.sort(key=lambda x: x["count"], reverse=True)
            
            return distribution
            
        except Exception as e:
            logger.error(f"Error getting category distribution: {str(e)}")
            raise

    def get_top_documents(self, tenant_id: str, limit: int = 10, metric: str = "downloads") -> List[Dict[str, Any]]:
        """Get top documents by specified metric"""
        try:
            if metric == "downloads":
                order_by = DocumentAnalytics.downloads.desc()
            elif metric == "recent":
                order_by = DocumentAnalytics.created_at.desc()
            elif metric == "size":
                order_by = DocumentAnalytics.file_size.desc()
            else:
                raise ValueError(f"Unsupported metric: {metric}")
            
            top_docs = self.db.query(DocumentAnalytics).filter(
                DocumentAnalytics.tenant_id == tenant_id
            ).order_by(order_by).limit(limit).all()
            
            return [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category,
                    "downloads": doc.downloads,
                    "file_size": doc.file_size,
                    "file_size_mb": round(doc.file_size / (1024 * 1024), 2),
                    "created_at": doc.created_at.isoformat(),
                    "rating": doc.rating,
                    "tags": doc.tags
                }
                for doc in top_docs
            ]
            
        except Exception as e:
            logger.error(f"Error getting top documents: {str(e)}")
            raise

    def get_user_activity(self, tenant_id: str, time_range: str = "7d") -> List[Dict[str, Any]]:
        """Get user activity data"""
        try:
            end_date = datetime.utcnow()
            start_date = self._get_start_date(end_date, time_range)
            
            activities = self.db.query(UserActivity).filter(
                and_(
                    UserActivity.tenant_id == tenant_id,
                    UserActivity.timestamp >= start_date,
                    UserActivity.timestamp <= end_date
                )
            ).order_by(UserActivity.timestamp.desc()).all()
            
            return [
                {
                    "user_id": activity.user_id,
                    "action": activity.action,
                    "resource_type": activity.resource_type,
                    "resource_id": activity.resource_id,
                    "timestamp": activity.timestamp.isoformat(),
                    "metadata": activity.metadata
                }
                for activity in activities
            ]
            
        except Exception as e:
            logger.error(f"Error getting user activity: {str(e)}")
            raise

    def get_compliance_report(self, tenant_id: str, time_range: str = "30d") -> Dict[str, Any]:
        """Get compliance report"""
        try:
            end_date = datetime.utcnow()
            start_date = self._get_start_date(end_date, time_range)
            
            # Get document compliance metrics
            total_docs = self.db.query(func.count(DocumentAnalytics.id)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).scalar()
            
            compliant_docs = self.db.query(func.count(DocumentAnalytics.id)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date,
                    DocumentAnalytics.is_compliant == True
                )
            ).scalar()
            
            compliance_rate = round((compliant_docs / total_docs) * 100, 2) if total_docs > 0 else 0
            
            # Get compliance by category
            category_compliance = self.db.query(
                DocumentAnalytics.category,
                func.count(DocumentAnalytics.id).label('total'),
                func.sum(func.case([(DocumentAnalytics.is_compliant == True, 1)], else_=0)).label('compliant')
            ).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).group_by(DocumentAnalytics.category).all()
            
            category_stats = []
            for cat_stat in category_compliance:
                cat_compliance_rate = round((cat_stat.compliant / cat_stat.total) * 100, 2) if cat_stat.total > 0 else 0
                category_stats.append({
                    "category": cat_stat.category,
                    "total": cat_stat.total,
                    "compliant": cat_stat.compliant,
                    "compliance_rate": cat_compliance_rate
                })
            
            return {
                "overall_compliance_rate": compliance_rate,
                "total_documents": total_docs,
                "compliant_documents": compliant_docs,
                "non_compliant_documents": total_docs - compliant_docs,
                "category_compliance": category_stats,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting compliance report: {str(e)}")
            raise

    def _get_start_date(self, end_date: datetime, time_range: str) -> datetime:
        """Calculate start date based on time range"""
        if time_range == "7d":
            return end_date - timedelta(days=7)
        elif time_range == "30d":
            return end_date - timedelta(days=30)
        elif time_range == "90d":
            return end_date - timedelta(days=90)
        elif time_range == "1y":
            return end_date - timedelta(days=365)
        else:
            return end_date - timedelta(days=30)

    def _get_document_statistics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get document statistics for the period"""
        try:
            # Total documents
            total_docs = self.db.query(func.count(DocumentAnalytics.id)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).scalar()
            
            # Total size
            total_size = self.db.query(func.sum(DocumentAnalytics.file_size)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).scalar() or 0
            
            # Total downloads
            total_downloads = self.db.query(func.sum(DocumentAnalytics.downloads)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).scalar() or 0
            
            # Average rating
            avg_rating = self.db.query(func.avg(DocumentAnalytics.rating)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date,
                    DocumentAnalytics.rating.isnot(None)
                )
            ).scalar() or 0
            
            return {
                "total": total_docs,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "total_size_gb": round(total_size / (1024 * 1024 * 1024), 2),
                "total_downloads": total_downloads,
                "average_rating": round(avg_rating, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting document statistics: {str(e)}")
            return {}

    def _get_user_statistics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user statistics for the period"""
        try:
            # Active users
            active_users = self.db.query(func.count(func.distinct(UserActivity.user_id))).filter(
                and_(
                    UserActivity.tenant_id == tenant_id,
                    UserActivity.timestamp >= start_date,
                    UserActivity.timestamp <= end_date
                )
            ).scalar()
            
            # Total actions
            total_actions = self.db.query(func.count(UserActivity.id)).filter(
                and_(
                    UserActivity.tenant_id == tenant_id,
                    UserActivity.timestamp >= start_date,
                    UserActivity.timestamp <= end_date
                )
            ).scalar()
            
            return {
                "active_users": active_users,
                "total_actions": total_actions,
                "actions_per_user": round(total_actions / active_users, 2) if active_users > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting user statistics: {str(e)}")
            return {}

    def _get_system_statistics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get system statistics for the period"""
        try:
            # Get latest system metrics
            latest_metrics = self.db.query(SystemMetrics).filter(
                SystemMetrics.tenant_id == tenant_id
            ).order_by(SystemMetrics.timestamp.desc()).first()
            
            if latest_metrics:
                return {
                    "cpu_usage": latest_metrics.cpu_usage,
                    "memory_usage": latest_metrics.memory_usage,
                    "disk_usage": latest_metrics.disk_usage,
                    "active_connections": latest_metrics.active_connections,
                    "response_time_ms": latest_metrics.response_time_ms,
                    "timestamp": latest_metrics.timestamp.isoformat()
                }
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Error getting system statistics: {str(e)}")
            return {}

    def _get_compliance_metrics(self, tenant_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get compliance metrics for the period"""
        try:
            # Compliance rate
            total_docs = self.db.query(func.count(DocumentAnalytics.id)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).scalar()
            
            compliant_docs = self.db.query(func.count(DocumentAnalytics.id)).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date,
                    DocumentAnalytics.is_compliant == True
                )
            ).scalar()
            
            compliance_rate = round((compliant_docs / total_docs) * 100, 2) if total_docs > 0 else 0
            
            return {
                "compliance_rate": compliance_rate,
                "total_documents": total_docs,
                "compliant_documents": compliant_docs,
                "non_compliant_documents": total_docs - compliant_docs
            }
            
        except Exception as e:
            logger.error(f"Error getting compliance metrics: {str(e)}")
            return {}

    def _get_document_trends(self, tenant_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get document creation trends"""
        try:
            # Group by day
            trends = self.db.query(
                func.date(DocumentAnalytics.created_at).label('date'),
                func.count(DocumentAnalytics.id).label('count')
            ).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).group_by(func.date(DocumentAnalytics.created_at)).order_by('date').all()
            
            return [
                {
                    "date": trend.date.isoformat(),
                    "documents": trend.count
                }
                for trend in trends
            ]
            
        except Exception as e:
            logger.error(f"Error getting document trends: {str(e)}")
            return []

    def _get_user_trends(self, tenant_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get user activity trends"""
        try:
            # Group by day
            trends = self.db.query(
                func.date(UserActivity.timestamp).label('date'),
                func.count(func.distinct(UserActivity.user_id)).label('active_users')
            ).filter(
                and_(
                    UserActivity.tenant_id == tenant_id,
                    UserActivity.timestamp >= start_date,
                    UserActivity.timestamp <= end_date
                )
            ).group_by(func.date(UserActivity.timestamp)).order_by('date').all()
            
            return [
                {
                    "date": trend.date.isoformat(),
                    "active_users": trend.active_users
                }
                for trend in trends
            ]
            
        except Exception as e:
            logger.error(f"Error getting user trends: {str(e)}")
            return []

    def _get_download_trends(self, tenant_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get download trends"""
        try:
            # Group by day
            trends = self.db.query(
                func.date(DocumentAnalytics.created_at).label('date'),
                func.sum(DocumentAnalytics.downloads).label('downloads')
            ).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).group_by(func.date(DocumentAnalytics.created_at)).order_by('date').all()
            
            return [
                {
                    "date": trend.date.isoformat(),
                    "downloads": trend.downloads or 0
                }
                for trend in trends
            ]
            
        except Exception as e:
            logger.error(f"Error getting download trends: {str(e)}")
            return []

    def _get_storage_trends(self, tenant_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get storage usage trends"""
        try:
            # Group by day
            trends = self.db.query(
                func.date(DocumentAnalytics.created_at).label('date'),
                func.sum(DocumentAnalytics.file_size).label('total_size')
            ).filter(
                and_(
                    DocumentAnalytics.tenant_id == tenant_id,
                    DocumentAnalytics.created_at >= start_date,
                    DocumentAnalytics.created_at <= end_date
                )
            ).group_by(func.date(DocumentAnalytics.created_at)).order_by('date').all()
            
            return [
                {
                    "date": trend.date.isoformat(),
                    "total_size_bytes": trend.total_size or 0,
                    "total_size_mb": round((trend.total_size or 0) / (1024 * 1024), 2)
                }
                for trend in trends
            ]
            
        except Exception as e:
            logger.error(f"Error getting storage trends: {str(e)}")
            return []
