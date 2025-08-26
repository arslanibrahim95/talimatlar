from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog
import pandas as pd
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.analytics import (
    UserActivityResponse, 
    DocumentStatsResponse,
    RiskAssessmentResponse,
    TrendAnalysis,
    RealTimeMetricsResponse,
    AnalyticsQuery,
    AnalyticsResult
)
from app.config import settings

logger = structlog.get_logger()

class AnalyticsService:
    """Main analytics service for data analysis and insights"""
    
    def __init__(self):
        self.cache_ttl = settings.cache_ttl
        self.max_data_points = settings.max_data_points
    
    async def get_user_activity(
        self, 
        user_id: str, 
        tenant_id: str, 
        days: int = 30
    ) -> UserActivityResponse:
        """Get user activity analytics for specified period"""
        try:
            async with AsyncSessionLocal() as session:
                # Get user activities from database
                query = text("""
                    SELECT 
                        da.user_id,
                        u.phone as user_name,
                        da.action,
                        da.document_id as resource,
                        da.timestamp,
                        da.ip_address,
                        da.session_id
                    FROM document_analytics da
                    LEFT JOIN users u ON da.user_id = u.id
                    WHERE da.tenant_id = :tenant_id
                    AND da.timestamp >= :start_date
                    ORDER BY da.timestamp DESC
                    LIMIT :limit
                """)
                
                start_date = datetime.utcnow() - timedelta(days=days)
                
                result = await session.execute(
                    query,
                    {
                        "tenant_id": tenant_id,
                        "start_date": start_date,
                        "limit": self.max_data_points
                    }
                )
                
                activities = []
                for row in result.fetchall():
                    activities.append({
                        "user_id": row.user_id,
                        "user_name": row.user_name or "Unknown",
                        "action": row.action,
                        "resource": row.resource or "Unknown",
                        "timestamp": row.timestamp,
                        "ip_address": row.ip_address,
                        "session_duration": None  # TODO: Calculate from session data
                    })
                
                # Calculate summary statistics
                total_activities = len(activities)
                unique_users = len(set(act["user_id"] for act in activities))
                
                # Group activities by action type
                action_summary = {}
                for activity in activities:
                    action = activity["action"]
                    action_summary[action] = action_summary.get(action, 0) + 1
                
                summary = {
                    "total_activities": total_activities,
                    "unique_users": unique_users,
                    "action_breakdown": action_summary,
                    "avg_activities_per_user": total_activities / unique_users if unique_users > 0 else 0
                }
                
                logger.info("User activity analytics generated", 
                           tenant_id=tenant_id, 
                           days=days, 
                           total_activities=total_activities)
                
                return UserActivityResponse(
                    activities=activities,
                    total_activities=total_activities,
                    unique_users=unique_users,
                    period=f"{days} days",
                    summary=summary
                )
                
        except Exception as e:
            logger.error("Failed to get user activity", error=str(e))
            raise
    
    async def get_document_stats(self, tenant_id: str) -> DocumentStatsResponse:
        """Get comprehensive document statistics"""
        try:
            async with AsyncSessionLocal() as session:
                # Get basic document statistics
                query = text("""
                    SELECT 
                        COUNT(*) as total_documents,
                        COALESCE(SUM(file_size), 0) as total_size,
                        COUNT(CASE WHEN created_at >= :recent_date THEN 1 END) as recent_uploads
                    FROM documents
                    WHERE tenant_id = :tenant_id AND is_active = true
                """)
                
                recent_date = datetime.utcnow() - timedelta(days=30)
                
                result = await session.execute(
                    query,
                    {
                        "tenant_id": tenant_id,
                        "recent_date": recent_date
                    }
                )
                
                row = result.fetchone()
                total_documents = row.total_documents
                total_size = row.total_size
                recent_uploads = row.recent_uploads
                
                # Get statistics by category
                category_query = text("""
                    SELECT 
                        category,
                        COUNT(*) as count,
                        COALESCE(SUM(file_size), 0) as total_size,
                        COALESCE(AVG(file_size), 0) as avg_size,
                        MAX(updated_at) as last_updated
                    FROM documents
                    WHERE tenant_id = :tenant_id AND is_active = true
                    GROUP BY category
                    ORDER BY count DESC
                """)
                
                category_result = await session.execute(
                    category_query,
                    {"tenant_id": tenant_id}
                )
                
                categories = []
                for cat_row in category_result.fetchall():
                    categories.append({
                        "category": cat_row.category,
                        "count": cat_row.count,
                        "total_size": cat_row.total_size,
                        "avg_size": cat_row.avg_size,
                        "last_updated": cat_row.last_updated
                    })
                
                # Get popular tags
                tags_query = text("""
                    SELECT 
                        unnest(tags) as tag,
                        COUNT(*) as count
                    FROM documents
                    WHERE tenant_id = :tenant_id AND is_active = true AND tags IS NOT NULL
                    GROUP BY tag
                    ORDER BY count DESC
                    LIMIT 10
                """)
                
                tags_result = await session.execute(
                    tags_query,
                    {"tenant_id": tenant_id}
                )
                
                popular_tags = []
                for tag_row in tags_result.fetchall():
                    popular_tags.append({
                        "tag": tag_row.tag,
                        "count": tag_row.count
                    })
                
                # Calculate storage usage
                storage_usage = {
                    "total_size_gb": total_size / (1024**3),
                    "avg_document_size_mb": total_size / (1024**2) / total_documents if total_documents > 0 else 0,
                    "documents_per_category": len(categories)
                }
                
                logger.info("Document statistics generated", 
                           tenant_id=tenant_id, 
                           total_documents=total_documents)
                
                return DocumentStatsResponse(
                    total_documents=total_documents,
                    total_size=total_size,
                    categories=categories,
                    recent_uploads=recent_uploads,
                    popular_tags=popular_tags,
                    storage_usage=storage_usage
                )
                
        except Exception as e:
            logger.error("Failed to get document stats", error=str(e))
            raise
    
    async def get_compliance_analytics(
        self, 
        tenant_id: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get compliance analytics and metrics"""
        try:
            async with AsyncSessionLocal() as session:
                # Set default date range if not provided
                if not start_date:
                    start_date = datetime.utcnow() - timedelta(days=30)
                if not end_date:
                    end_date = datetime.utcnow()
                
                # Calculate compliance metrics
                compliance_metrics = {
                    "document_compliance_rate": 0.95,  # TODO: Calculate from actual data
                    "user_training_completion": 0.87,
                    "incident_response_time": 2.5,  # hours
                    "audit_trail_completeness": 0.98,
                    "policy_acknowledgment_rate": 0.92
                }
                
                # Get compliance trends
                trends_query = text("""
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as documents_created,
                        COUNT(CASE WHEN is_public = true THEN 1 END) as public_documents
                    FROM documents
                    WHERE tenant_id = :tenant_id 
                    AND created_at BETWEEN :start_date AND :end_date
                    GROUP BY DATE(created_at)
                    ORDER BY date
                """)
                
                trends_result = await session.execute(
                    trends_query,
                    {
                        "tenant_id": tenant_id,
                        "start_date": start_date,
                        "end_date": end_date
                    }
                )
                
                trends = []
                for trend_row in trends_result.fetchall():
                    trends.append({
                        "date": trend_row.date.isoformat(),
                        "documents_created": trend_row.documents_created,
                        "public_documents": trend_row.public_documents
                    })
                
                logger.info("Compliance analytics generated", 
                           tenant_id=tenant_id, 
                           start_date=start_date, 
                           end_date=end_date)
                
                return {
                    "metrics": compliance_metrics,
                    "trends": trends,
                    "period": {
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat()
                    },
                    "recommendations": [
                        "Increase user training completion rate",
                        "Improve incident response time",
                        "Review document access controls"
                    ]
                }
                
        except Exception as e:
            logger.error("Failed to get compliance analytics", error=str(e))
            raise
    
    async def get_risk_assessment(self, tenant_id: str) -> RiskAssessmentResponse:
        """Perform comprehensive risk assessment"""
        try:
            async with AsyncSessionLocal() as session:
                # Calculate risk factors based on various metrics
                risk_factors = []
                
                # Document access risk
                access_query = text("""
                    SELECT COUNT(*) as public_docs
                    FROM documents
                    WHERE tenant_id = :tenant_id AND is_public = true
                """)
                
                access_result = await session.execute(
                    access_query,
                    {"tenant_id": tenant_id}
                )
                
                public_docs = access_result.fetchone().public_docs
                if public_docs > 10:
                    risk_factors.append({
                        "factor_name": "High number of public documents",
                        "risk_level": "medium",
                        "probability": 0.7,
                        "impact": 0.6,
                        "risk_score": 0.7 * 0.6,
                        "description": f"{public_docs} documents are publicly accessible",
                        "mitigation": "Review and restrict public document access"
                    })
                
                # User activity risk
                activity_query = text("""
                    SELECT COUNT(DISTINCT user_id) as active_users
                    FROM document_analytics
                    WHERE tenant_id = :tenant_id 
                    AND timestamp >= :recent_date
                """)
                
                recent_date = datetime.utcnow() - timedelta(days=7)
                activity_result = await session.execute(
                    activity_query,
                    {
                        "tenant_id": tenant_id,
                        "recent_date": recent_date
                    }
                )
                
                active_users = activity_result.fetchone().active_users
                if active_users < 5:
                    risk_factors.append({
                        "factor_name": "Low user engagement",
                        "risk_level": "low",
                        "probability": 0.8,
                        "impact": 0.3,
                        "risk_score": 0.8 * 0.3,
                        "description": f"Only {active_users} users active in the last week",
                        "mitigation": "Increase user training and engagement"
                    })
                
                # Calculate overall risk level
                total_risk_score = sum(factor["risk_score"] for factor in risk_factors)
                if total_risk_score > 0.7:
                    overall_risk_level = "high"
                elif total_risk_score > 0.4:
                    overall_risk_level = "medium"
                else:
                    overall_risk_level = "low"
                
                # Generate recommendations
                recommendations = [
                    "Regular security audits",
                    "User access reviews",
                    "Document classification training",
                    "Incident response drills"
                ]
                
                logger.info("Risk assessment completed", 
                           tenant_id=tenant_id, 
                           overall_risk_level=overall_risk_level)
                
                return RiskAssessmentResponse(
                    assessment_id=f"risk_{tenant_id}_{datetime.utcnow().strftime('%Y%m%d')}",
                    assessment_date=datetime.utcnow(),
                    overall_risk_level=overall_risk_level,
                    risk_factors=risk_factors,
                    total_risk_score=total_risk_score,
                    recommendations=recommendations,
                    next_assessment_date=datetime.utcnow() + timedelta(days=30)
                )
                
        except Exception as e:
            logger.error("Failed to get risk assessment", error=str(e))
            raise
    
    async def get_trends(
        self, 
        tenant_id: str, 
        metric: str, 
        period: str = "month"
    ) -> TrendAnalysis:
        """Get trend analysis for specific metrics"""
        try:
            async with AsyncSessionLocal() as session:
                # Build query based on metric and period
                if metric == "views":
                    query = text("""
                        SELECT 
                            DATE(timestamp) as date,
                            COUNT(*) as value
                        FROM document_analytics
                        WHERE tenant_id = :tenant_id 
                        AND action = 'view'
                        AND timestamp >= :start_date
                        GROUP BY DATE(timestamp)
                        ORDER BY date
                    """)
                elif metric == "downloads":
                    query = text("""
                        SELECT 
                            DATE(timestamp) as date,
                            COUNT(*) as value
                        FROM document_analytics
                        WHERE tenant_id = :tenant_id 
                        AND action = 'download'
                        AND timestamp >= :start_date
                        GROUP BY DATE(timestamp)
                        ORDER BY date
                    """)
                elif metric == "uploads":
                    query = text("""
                        SELECT 
                            DATE(created_at) as date,
                            COUNT(*) as value
                        FROM documents
                        WHERE tenant_id = :tenant_id 
                        AND created_at >= :start_date
                        GROUP BY DATE(created_at)
                        ORDER BY date
                    """)
                else:
                    raise ValueError(f"Unsupported metric: {metric}")
                
                # Calculate start date based on period
                if period == "week":
                    start_date = datetime.utcnow() - timedelta(days=7)
                elif period == "month":
                    start_date = datetime.utcnow() - timedelta(days=30)
                elif period == "year":
                    start_date = datetime.utcnow() - timedelta(days=365)
                else:
                    start_date = datetime.utcnow() - timedelta(days=30)
                
                result = await session.execute(
                    query,
                    {
                        "tenant_id": tenant_id,
                        "start_date": start_date
                    }
                )
                
                data_points = []
                for row in result.fetchall():
                    data_points.append({
                        "timestamp": row.date,
                        "value": row.value,
                        "change": None  # TODO: Calculate change from previous point
                    })
                
                # Calculate trend direction and growth rate
                if len(data_points) >= 2:
                    first_value = data_points[0]["value"]
                    last_value = data_points[-1]["value"]
                    
                    if last_value > first_value:
                        trend_direction = "up"
                        growth_rate = ((last_value - first_value) / first_value) * 100
                    elif last_value < first_value:
                        trend_direction = "down"
                        growth_rate = ((first_value - last_value) / first_value) * 100
                    else:
                        trend_direction = "stable"
                        growth_rate = 0.0
                else:
                    trend_direction = "stable"
                    growth_rate = 0.0
                
                logger.info("Trend analysis completed", 
                           tenant_id=tenant_id, 
                           metric=metric, 
                           period=period)
                
                return TrendAnalysis(
                    metric=metric,
                    period=period,
                    data_points=data_points,
                    trend_direction=trend_direction,
                    growth_rate=growth_rate,
                    forecast=None  # TODO: Implement forecasting
                )
                
        except Exception as e:
            logger.error("Failed to get trends", error=str(e))
            raise
    
    async def get_real_time_metrics(self, tenant_id: str) -> RealTimeMetricsResponse:
        """Get real-time system metrics"""
        try:
            async with AsyncSessionLocal() as session:
                # Get current active users
                active_users_query = text("""
                    SELECT COUNT(DISTINCT user_id) as active_users
                    FROM document_analytics
                    WHERE tenant_id = :tenant_id 
                    AND timestamp >= :recent_time
                """)
                
                recent_time = datetime.utcnow() - timedelta(minutes=15)
                
                active_result = await session.execute(
                    active_users_query,
                    {
                        "tenant_id": tenant_id,
                        "recent_time": recent_time
                    }
                )
                
                active_users = active_result.fetchone().active_users
                
                # Get recent activity metrics
                recent_activity_query = text("""
                    SELECT 
                        action,
                        COUNT(*) as count
                    FROM document_analytics
                    WHERE tenant_id = :tenant_id 
                    AND timestamp >= :recent_time
                    GROUP BY action
                """)
                
                activity_result = await session.execute(
                    recent_activity_query,
                    {
                        "tenant_id": tenant_id,
                        "recent_time": recent_time
                    }
                )
                
                metrics = []
                for row in activity_result.fetchall():
                    metrics.append({
                        "metric_name": f"recent_{row.action}",
                        "current_value": row.count,
                        "previous_value": 0,  # TODO: Get from previous period
                        "change_percent": 0.0,
                        "trend": "stable",
                        "last_updated": datetime.utcnow()
                    })
                
                # System status
                system_status = {
                    "database": "healthy",
                    "cache": "healthy",
                    "storage": "healthy"
                }
                
                # Server load (mock data)
                server_load = {
                    "cpu_usage": 45.2,
                    "memory_usage": 67.8,
                    "disk_usage": 23.1,
                    "network_io": 12.5
                }
                
                logger.info("Real-time metrics generated", 
                           tenant_id=tenant_id, 
                           active_users=active_users)
                
                return RealTimeMetricsResponse(
                    metrics=metrics,
                    system_status=system_status,
                    active_users=active_users,
                    server_load=server_load
                )
                
        except Exception as e:
            logger.error("Failed to get real-time metrics", error=str(e))
            raise
    
    async def get_metrics_summary(
        self, 
        tenant_id: str, 
        period: str = "day"
    ) -> Dict[str, Any]:
        """Get metrics summary for specified period"""
        try:
            async with AsyncSessionLocal() as session:
                # Calculate time range
                if period == "hour":
                    start_time = datetime.utcnow() - timedelta(hours=1)
                elif period == "day":
                    start_time = datetime.utcnow() - timedelta(days=1)
                elif period == "week":
                    start_time = datetime.utcnow() - timedelta(weeks=1)
                elif period == "month":
                    start_time = datetime.utcnow() - timedelta(days=30)
                else:
                    start_time = datetime.utcnow() - timedelta(days=1)
                
                # Get summary metrics
                summary_query = text("""
                    SELECT 
                        COUNT(*) as total_activities,
                        COUNT(DISTINCT user_id) as unique_users,
                        COUNT(DISTINCT document_id) as documents_accessed
                    FROM document_analytics
                    WHERE tenant_id = :tenant_id 
                    AND timestamp >= :start_time
                """)
                
                summary_result = await session.execute(
                    summary_query,
                    {
                        "tenant_id": tenant_id,
                        "start_time": start_time
                    }
                )
                
                summary_row = summary_result.fetchone()
                
                summary = {
                    "period": period,
                    "total_activities": summary_row.total_activities,
                    "unique_users": summary_row.unique_users,
                    "documents_accessed": summary_row.documents_accessed,
                    "avg_activities_per_user": summary_row.total_activities / summary_row.unique_users if summary_row.unique_users > 0 else 0,
                    "start_time": start_time.isoformat(),
                    "end_time": datetime.utcnow().isoformat()
                }
                
                logger.info("Metrics summary generated", 
                           tenant_id=tenant_id, 
                           period=period)
                
                return summary
                
        except Exception as e:
            logger.error("Failed to get metrics summary", error=str(e))
            raise
