"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table('post',
                Field('content'),
                Field('first_name'),
                Field('last_name'),
                Field('author_email'),
                Field('username'),
                Field('thumbs_up', 'list:string'),
                Field('thumbs_down', 'list:string'),
)


db.commit()
