import os
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
import mimetypes
import hashlib
import uuid

from ..utils.logger import get_logger

logger = get_logger(__name__)

class StorageService:
    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.documents_path = self.base_path / "documents"
        self.temp_path = self.base_path / "temp"
        self.backup_path = self.base_path / "backup"
        
        for path in [self.documents_path, self.temp_path, self.backup_path]:
            path.mkdir(exist_ok=True)

    def save_file(self, file_data: bytes, filename: str, category: str = "general") -> Dict[str, Any]:
        """Save file to storage with metadata"""
        try:
            # Generate unique filename
            file_extension = Path(filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create category directory
            category_path = self.documents_path / category
            category_path.mkdir(exist_ok=True)
            
            # Full file path
            file_path = category_path / unique_filename
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(file_data)
            
            # Get file metadata
            file_size = len(file_data)
            file_hash = self._calculate_file_hash(file_data)
            mime_type = self._get_mime_type(filename)
            
            # Create metadata
            metadata = {
                "original_filename": filename,
                "stored_filename": unique_filename,
                "file_path": str(file_path),
                "file_size": file_size,
                "file_hash": file_hash,
                "mime_type": mime_type,
                "category": category,
                "uploaded_at": datetime.utcnow().isoformat(),
                "access_url": f"/storage/{category}/{unique_filename}"
            }
            
            logger.info(f"File saved: {unique_filename} ({file_size} bytes)")
            return metadata
            
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise

    def get_file(self, file_path: str) -> Optional[bytes]:
        """Get file content by path"""
        try:
            full_path = self.base_path / file_path
            if full_path.exists() and full_path.is_file():
                with open(full_path, "rb") as f:
                    return f.read()
            return None
            
        except Exception as e:
            logger.error(f"Error getting file: {str(e)}")
            return None

    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        try:
            full_path = self.base_path / file_path
            if full_path.exists():
                full_path.unlink()
                logger.info(f"File deleted: {file_path}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False

    def move_file(self, source_path: str, destination_path: str) -> bool:
        """Move file to different location"""
        try:
            source = self.base_path / source_path
            destination = self.base_path / destination_path
            
            if source.exists():
                # Create destination directory if it doesn't exist
                destination.parent.mkdir(parents=True, exist_ok=True)
                
                # Move file
                shutil.move(str(source), str(destination))
                logger.info(f"File moved: {source_path} -> {destination_path}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error moving file: {str(e)}")
            return False

    def copy_file(self, source_path: str, destination_path: str) -> bool:
        """Copy file to different location"""
        try:
            source = self.base_path / source_path
            destination = self.base_path / destination_path
            
            if source.exists():
                # Create destination directory if it doesn't exist
                destination.parent.mkdir(parents=True, exist_ok=True)
                
                # Copy file
                shutil.copy2(str(source), str(destination))
                logger.info(f"File copied: {source_path} -> {destination_path}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error copying file: {str(e)}")
            return False

    def create_backup(self, file_path: str) -> Optional[str]:
        """Create backup of file"""
        try:
            source = self.base_path / file_path
            if not source.exists():
                return None
            
            # Create backup filename with timestamp
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"{Path(file_path).stem}_{timestamp}{Path(file_path).suffix}"
            backup_path = self.backup_path / backup_filename
            
            # Copy file to backup
            shutil.copy2(str(source), str(backup_path))
            
            logger.info(f"Backup created: {backup_filename}")
            return str(backup_path)
            
        except Exception as e:
            logger.error(f"Error creating backup: {str(e)}")
            return None

    def get_storage_info(self) -> Dict[str, Any]:
        """Get storage information and statistics"""
        try:
            total_size = 0
            file_count = 0
            category_stats = {}
            
            # Walk through documents directory
            for root, dirs, files in os.walk(self.documents_path):
                for file in files:
                    file_path = Path(root) / file
                    try:
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        file_count += 1
                        
                        # Get category from path
                        relative_path = file_path.relative_to(self.documents_path)
                        category = relative_path.parts[0] if relative_path.parts else "unknown"
                        category_stats[category] = category_stats.get(category, 0) + 1
                        
                    except OSError:
                        continue
            
            # Get disk usage
            disk_usage = shutil.disk_usage(self.base_path)
            
            return {
                "total_files": file_count,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "total_size_gb": round(total_size / (1024 * 1024 * 1024), 2),
                "category_distribution": category_stats,
                "disk_usage": {
                    "total": disk_usage.total,
                    "used": disk_usage.used,
                    "free": disk_usage.free,
                    "free_percentage": round((disk_usage.free / disk_usage.total) * 100, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting storage info: {str(e)}")
            return {}

    def cleanup_temp_files(self, max_age_hours: int = 24) -> int:
        """Clean up temporary files older than specified age"""
        try:
            cleaned_count = 0
            cutoff_time = datetime.utcnow().timestamp() - (max_age_hours * 3600)
            
            for file_path in self.temp_path.iterdir():
                if file_path.is_file():
                    try:
                        file_age = file_path.stat().st_mtime
                        if file_age < cutoff_time:
                            file_path.unlink()
                            cleaned_count += 1
                    except OSError:
                        continue
            
            logger.info(f"Cleaned up {cleaned_count} temporary files")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error cleaning up temp files: {str(e)}")
            return 0

    def validate_file(self, file_data: bytes, filename: str) -> Dict[str, Any]:
        """Validate file before saving"""
        try:
            validation_result = {
                "is_valid": True,
                "errors": [],
                "warnings": []
            }
            
            # Check file size
            file_size = len(file_data)
            max_size = 100 * 1024 * 1024  # 100MB
            
            if file_size > max_size:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"File size ({file_size} bytes) exceeds maximum allowed size ({max_size} bytes)")
            
            # Check file extension
            allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif']
            file_extension = Path(filename).suffix.lower()
            
            if file_extension not in allowed_extensions:
                validation_result["warnings"].append(f"File extension '{file_extension}' is not in the recommended list")
            
            # Check for malicious content (basic check)
            if self._contains_suspicious_content(file_data):
                validation_result["warnings"].append("File content may contain suspicious patterns")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return {
                "is_valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "warnings": []
            }

    def _calculate_file_hash(self, file_data: bytes) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(file_data).hexdigest()

    def _get_mime_type(self, filename: str) -> str:
        """Get MIME type based on file extension"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or 'application/octet-stream'

    def _contains_suspicious_content(self, file_data: bytes) -> bool:
        """Basic check for suspicious content patterns"""
        suspicious_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'<iframe',
            b'<object',
            b'<embed'
        ]
        
        file_str = file_data.lower()
        return any(pattern in file_str for pattern in suspicious_patterns)
