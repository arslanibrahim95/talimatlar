"""
Database Layer Setup
Installation script for the database layer package
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="talimatlar-database-layer",
    version="1.0.0",
    author="Talimatlar Team",
    author_email="team@talimatlar.com",
    description="Database layer for Talimatlar microservices architecture",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/talimatlar/database-layer",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Database",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "mypy>=1.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
        ],
        "docs": [
            "sphinx>=7.0.0",
            "sphinx-rtd-theme>=1.3.0",
            "myst-parser>=2.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "talimatlar-db-init=database_layer.init_database:main",
            "talimatlar-db-migrate=database_layer.migrations.migration_runner:main",
        ],
    },
    include_package_data=True,
    package_data={
        "database_layer": [
            "migrations/*.sql",
            "config/*.yaml",
            "config/*.json",
        ],
    },
)
