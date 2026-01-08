from flask import g, abort

def get_resource(model_class, id_key='id'):
    def getter(*args, **kwargs):
        resource_id = kwargs.get(id_key)

        resource = model_class.query.get(resource_id)

        if not resource:
            abort(404, description=f"{model_class.__name__} not found")

        g.current_resource = resource

        return getattr(resource, 'user_id', None)

    return getter