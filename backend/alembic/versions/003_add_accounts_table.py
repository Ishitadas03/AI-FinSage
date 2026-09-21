"""Add accounts table for financial accounts management

Revision ID: 003_add_accounts
Revises: 002_add_refresh_sessions
Create Date: 2026-09-21 21:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_add_accounts'
down_revision: Union[str, None] = '002_add_refresh_sessions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), nullable=False),
        sa.Column('balance', sa.Numeric(precision=18, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='INR', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_id'), 'accounts', ['id'], unique=False)
    op.create_index(op.f('ix_accounts_user_id'), 'accounts', ['user_id'], unique=False)
    op.create_index(op.f('ix_accounts_account_type'), 'accounts', ['account_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_accounts_account_type'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_user_id'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_id'), table_name='accounts')
    op.drop_table('accounts')
