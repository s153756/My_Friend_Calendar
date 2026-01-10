from flask import g, abort
from app.extensions import db


def get_resource(model_class, id_key='id'):
    def getter(*args, **kwargs):
        resource_id = kwargs.get(id_key)

        resource = db.session.get(model_class, resource_id)

        if not resource:
            abort(404, description=f"{model_class.__name__} not found")

        g.current_resource = resource

        return getattr(resource, 'owner_id', None)

    return getter