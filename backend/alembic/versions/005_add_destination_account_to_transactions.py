"""Add destination_account_id to transactions table for transfer ledger support

Revision ID: 005_add_destination_account
Revises: 004_add_transactions
Create Date: 2026-09-21 21:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005_add_destination_account'
down_revision: Union[str, None] = '004_add_transactions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'transactions',
        sa.Column('destination_account_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_transactions_destination_account_id_accounts',
        'transactions',
        'accounts',
        ['destination_account_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(
        op.f('ix_transactions_destination_account_id'),
        'transactions',
        ['destination_account_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_transactions_destination_account_id'), table_name='transactions')
    op.drop_constraint('fk_transactions_destination_account_id_accounts', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'destination_account_id')
