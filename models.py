"""
This file defines the database models
"""

from .common import db, Field
from pydal.validators import *

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later
#
# db.commit()
#

#Profiles Table
db.define_table(
    'profile',
    Field('username', requires=IS_NOT_EMPTY()),
    Field('email', requires=IS_NOT_EMPTY()),
    Field('first_name', requires=IS_NOT_EMPTY()),
    Field('last_name', requires=IS_NOT_EMPTY()),
    Field('rating', 'integer', default=0),
    #Field('picture', 'upload', uploadfield='picture_file'),
    #Field('picture_file', 'blob')),
)

#Posts Table
db.define_table(
    'post',
    Field('profile_id', 'reference profile'),
    Field('content', requires=IS_NOT_EMPTY()),
    Field('date', requires=IS_NOT_EMPTY()),
    Field('label', requires=IS_NOT_EMPTY()),
    Field('votes', 'integer', default=0),
)

#Comments Table
db.define_table(
    'comments',
    Field('profile_id', 'reference profile'),
    Field('post_id', 'reference post'),
    Field('content', requires=IS_NOT_EMPTY()),
    Field('date', requires=IS_NOT_EMPTY()),
)

db.commit()