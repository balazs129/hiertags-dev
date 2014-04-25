from zipfile import ZipFile


def select_cysnetwork(inputfile):
    sessionfile = ZipFile(inputfile, 'r')
    contents = sessionfile.namelist()
    networks = []
    for elem in contents:
        tmp = elem.split('/')
        if tmp[1] == 'networks':
            networks.append((tmp[2], elem))
        elif tmp[1][-6:] == '.xgmml':
            networks.append((tmp[1], elem))
    return len(networks), sessionfile.open(networks[0][1], 'r')