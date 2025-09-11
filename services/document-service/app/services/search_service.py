from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
import re
import json

# from ..models.document import Document  # Commented out - models not implemented yet
from ..utils.logger import get_logger

logger = get_logger(__name__)

class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def index_document(self, document: Any) -> bool:
        """Index a document for search"""
        try:
            # For now, we'll use PostgreSQL full-text search
            # In production, you might want to use Elasticsearch or MeiliSearch
            
            # Update the document's search vector
            search_text = f"{document.title} {document.description or ''} {document.content or ''}"
            
            # Create search vector using PostgreSQL's to_tsvector
            self.db.execute(
                text("""
                    UPDATE documents 
                    SET search_vector = to_tsvector('english', :search_text)
                    WHERE id = :doc_id
                """),
                {"search_text": search_text, "doc_id": document.id}
            )
            
            self.db.commit()
            logger.info(f"Document indexed for search: {document.id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error indexing document {document.id}: {str(e)}")
            return False

    def update_document_index(self, document: Any) -> bool:
        """Update document search index"""
        return self.index_document(document)

    def remove_document_index(self, document_id: str) -> bool:
        """Remove document from search index"""
        try:
            # Clear search vector
            self.db.execute(
                text("UPDATE documents SET search_vector = NULL WHERE id = :doc_id"),
                {"doc_id": document_id}
            )
            
            self.db.commit()
            logger.info(f"Document removed from search index: {document_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing document from search index {document_id}: {str(e)}")
            return False

    def search_documents(
        self, 
        query: str, 
        tenant_id: str, 
        page: int = 1, 
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search documents using full-text search"""
        try:
            # Build search query
            search_query = self._build_search_query(query, tenant_id, filters)
            
            # Execute search
            results = self.db.execute(search_query).fetchall()
            
            # Process results
            search_results = []
            for row in results:
                search_results.append({
                    "id": row.id,
                    "title": row.title,
                    "description": row.description,
                    "category": row.category,
                    "relevance_score": row.relevance_score,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            # Get total count
            count_query = self._build_count_query(query, tenant_id, filters)
            total = self.db.execute(count_query).scalar()
            
            # Apply pagination
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_results = search_results[start_idx:end_idx]
            
            # Generate suggestions
            suggestions = self._generate_suggestions(query, tenant_id)
            
            return {
                "results": paginated_results,
                "total": total,
                "page": page,
                "limit": limit,
                "query": query,
                "suggestions": suggestions
            }
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise

    def _build_search_query(self, query: str, tenant_id: str, filters: Optional[Dict[str, Any]] = None):
        """Build the search SQL query"""
        # Base query with full-text search
        sql = """
            SELECT 
                d.id, d.title, d.description, d.category, d.created_at,
                ts_rank(d.search_vector, plainto_tsquery('english', :query)) as relevance_score
            FROM documents d
            WHERE d.tenant_id = :tenant_id
            AND d.search_vector @@ plainto_tsquery('english', :query)
        """
        
        params = {"query": query, "tenant_id": tenant_id}
        
        # Add filters
        if filters:
            if filters.get('category'):
                sql += " AND d.category = :category"
                params['category'] = filters['category']
            
            if filters.get('status'):
                sql += " AND d.status = :status"
                params['status'] = filters['status']
            
            if filters.get('risk_level'):
                sql += " AND d.risk_level = :risk_level"
                params['risk_level'] = filters['risk_level']
            
            if filters.get('created_by'):
                sql += " AND d.created_by = :created_by"
                params['created_by'] = filters['created_by']
            
            if filters.get('date_from'):
                sql += " AND d.created_at >= :date_from"
                params['date_from'] = filters['date_from']
            
            if filters.get('date_to'):
                sql += " AND d.created_at <= :date_to"
                params['date_to'] = filters['date_to']
        
        # Order by relevance and date
        sql += """
            ORDER BY relevance_score DESC, d.created_at DESC
        """
        
        return text(sql), params

    def _build_count_query(self, query: str, tenant_id: str, filters: Optional[Dict[str, Any]] = None):
        """Build the count SQL query"""
        sql = """
            SELECT COUNT(*)
            FROM documents d
            WHERE d.tenant_id = :tenant_id
            AND d.search_vector @@ plainto_tsquery('english', :query)
        """
        
        params = {"query": query, "tenant_id": tenant_id}
        
        # Add filters
        if filters:
            if filters.get('category'):
                sql += " AND d.category = :category"
                params['category'] = filters['category']
            
            if filters.get('status'):
                sql += " AND d.status = :status"
                params['status'] = filters['status']
            
            if filters.get('risk_level'):
                sql += " AND d.risk_level = :risk_level"
                params['risk_level'] = filters['risk_level']
            
            if filters.get('created_by'):
                sql += " AND d.created_by = :created_by"
                params['created_by'] = filters['created_by']
            
            if filters.get('date_from'):
                sql += " AND d.created_at >= :date_from"
                params['date_from'] = filters['date_from']
            
            if filters.get('date_to'):
                sql += " AND d.created_at <= :date_to"
                params['date_to'] = filters['date_to']
        
        return text(sql), params

    def _generate_suggestions(self, query: str, tenant_id: str) -> List[str]:
        """Generate search suggestions based on query"""
        try:
            # Get similar titles and categories
            suggestions = []
            
            # Split query into words
            words = re.findall(r'\w+', query.lower())
            
            if words:
                # Find documents with similar words in title
                similar_titles = self.db.query(Document.title).filter(
                    and_(
                        Document.tenant_id == tenant_id,
                        or_(*[Document.title.ilike(f'%{word}%') for word in words])
                    )
                ).limit(5).all()
                
                for title in similar_titles:
                    if title[0] not in suggestions:
                        suggestions.append(title[0])
                
                # Find similar categories
                similar_categories = self.db.query(Document.category).filter(
                    and_(
                        Document.tenant_id == tenant_id,
                        or_(*[Document.category.ilike(f'%{word}%') for word in words])
                    )
                ).limit(3).all()
                
                for category in similar_categories:
                    if category[0] not in suggestions:
                        suggestions.append(category[0])
            
            return suggestions[:10]  # Limit to 10 suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            return []

    def search_by_tags(self, tags: List[str], tenant_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Search documents by tags"""
        try:
            # Build tag search query
            sql = """
                SELECT 
                    d.id, d.title, d.description, d.category, d.created_at,
                    array_length(array(
                        SELECT unnest(d.tags) INTERSECT SELECT unnest(:tags)
                    ), 1) as tag_match_count
                FROM documents d
                WHERE d.tenant_id = :tenant_id
                AND d.tags && :tags
                ORDER BY tag_match_count DESC, d.created_at DESC
                LIMIT :limit OFFSET :offset
            """
            
            offset = (page - 1) * limit
            params = {
                "tags": tags,
                "tenant_id": tenant_id,
                "limit": limit,
                "offset": offset
            }
            
            results = self.db.execute(text(sql), params).fetchall()
            
            # Get total count
            count_sql = """
                SELECT COUNT(*)
                FROM documents d
                WHERE d.tenant_id = :tenant_id
                AND d.tags && :tags
            """
            
            total = self.db.execute(text(count_sql), {
                "tags": tags,
                "tenant_id": tenant_id
            }).scalar()
            
            # Process results
            search_results = []
            for row in results:
                search_results.append({
                    "id": row.id,
                    "title": row.title,
                    "description": row.description,
                    "category": row.category,
                    "tag_match_count": row.tag_match_count,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return {
                "results": search_results,
                "total": total,
                "page": page,
                "limit": limit,
                "tags": tags
            }
            
        except Exception as e:
            logger.error(f"Error searching by tags: {str(e)}")
            raise

    def search_by_category(self, category: str, tenant_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Search documents by category"""
        try:
            # Build category search query
            sql = """
                SELECT 
                    d.id, d.title, d.description, d.category, d.created_at,
                    d.risk_level, d.reading_time
                FROM documents d
                WHERE d.tenant_id = :tenant_id
                AND d.category = :category
                ORDER BY d.created_at DESC
                LIMIT :limit OFFSET :offset
            """
            
            offset = (page - 1) * limit
            params = {
                "category": category,
                "tenant_id": tenant_id,
                "limit": limit,
                "offset": offset
            }
            
            results = self.db.execute(text(sql), params).fetchall()
            
            # Get total count
            count_sql = """
                SELECT COUNT(*)
                FROM documents d
                WHERE d.tenant_id = :tenant_id
                AND d.category = :category
            """
            
            total = self.db.execute(text(count_sql), {
                "category": category,
                "tenant_id": tenant_id
            }).scalar()
            
            # Process results
            search_results = []
            for row in results:
                search_results.append({
                    "id": row.id,
                    "title": row.title,
                    "description": row.description,
                    "category": row.category,
                    "risk_level": row.risk_level,
                    "reading_time": row.reading_time,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return {
                "results": search_results,
                "total": total,
                "page": page,
                "limit": limit,
                "category": category
            }
            
        except Exception as e:
            logger.error(f"Error searching by category: {str(e)}")
            raise

    def get_search_statistics(self, tenant_id: str) -> Dict[str, Any]:
        """Get search statistics for analytics"""
        try:
            # Get total documents
            total_docs = self.db.query(func.count(Document.id)).filter(
                Document.tenant_id == tenant_id
            ).scalar()
            
            # Get documents with search vectors
            indexed_docs = self.db.query(func.count(Document.id)).filter(
                and_(
                    Document.tenant_id == tenant_id,
                    Document.search_vector.isnot(None)
                )
            ).scalar()
            
            # Get categories distribution
            categories = self.db.query(
                Document.category,
                func.count(Document.id)
            ).filter(
                Document.tenant_id == tenant_id
            ).group_by(Document.category).all()
            
            # Get tags distribution
            all_tags = []
            tag_docs = self.db.query(Document.tags).filter(
                Document.tenant_id == tenant_id
            ).all()
            
            for doc_tags in tag_docs:
                if doc_tags[0]:
                    all_tags.extend(doc_tags[0])
            
            tag_counts = {}
            for tag in all_tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            # Sort tags by frequency
            sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
            
            return {
                "total_documents": total_docs,
                "indexed_documents": indexed_docs,
                "indexing_coverage": round((indexed_docs / total_docs * 100) if total_docs > 0 else 0, 2),
                "categories": [{"name": cat, "count": count} for cat, count in categories],
                "top_tags": sorted_tags[:20],  # Top 20 tags
                "total_unique_tags": len(tag_counts)
            }
            
        except Exception as e:
            logger.error(f"Error getting search statistics: {str(e)}")
            raise

    def get_tenant_id_from_user(self, user_id: str) -> str:
        """Get tenant ID from user ID - placeholder for user service integration"""
        # TODO: Implement proper user service integration
        return "default_tenant"
