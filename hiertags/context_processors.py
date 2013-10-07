
def act_menu(request):
    return {'act_menu': request.path.strip('/').split('/')[0]}