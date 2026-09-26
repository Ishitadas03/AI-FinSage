"""Add clerk_user_id and make password_hash nullable on users table

Revision ID: 012_add_clerk_user_id
Revises: 011_add_import_fields
Create Date: 2026-09-26 18:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '012_add_clerk_user_id'
down_revision: Union[str, None] = '011_add_import_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add clerk_user_id column
    op.add_column('users', sa.Column('clerk_user_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_users_clerk_user_id'), 'users', ['clerk_user_id'], unique=True)

    # Make password_hash nullable for external Clerk users
    op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=False)
    op.drop_index(op.f('ix_users_clerk_user_id'), table_name='users')
    op.drop_column('users', 'clerk_user_id')
