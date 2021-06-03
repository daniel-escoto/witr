"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *

def get_time():
    return datetime.datetime.utcnow()
def get_user_id():
    return auth.current_user.get('id') if auth.current_user else None
### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later


db.define_table('profile',
                Field('user', 'reference auth_user', default = get_user_id),
                Field('username'),
                #Field('picture', 'text'),
                Field('file_name'),
                Field('file_type'),
                Field('file_date'),
                Field('file_path'),
                Field('file_size', 'integer'),
                Field('confirmed', 'boolean', default=False), # Was the upload to GCS confirmed?


)


db.define_table('post',
                Field('content'),
                Field('first_name'),
                Field('last_name'),
                Field('author_email'),
                Field('username'),
                Field('thumbs_up', 'list:string'),
                Field('thumbs_down', 'list:string'),
                Field('datetime', 'datetime'),
)

db.define_table('comment',
                Field('parent_post', 'reference post'),
                Field('content'),
                Field('author_email'),
                Field('username'),
                Field('thumbs_up', 'list:string'),
                Field('thumbs_down', 'list:string'),
                Field('datetime', 'datetime'),
                )


db.commit()
