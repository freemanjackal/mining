def get_pseudorandom_number(balances):
    string = b''
    for user, balance in balances.iteritems():
        string = string + b'%s, %0.0f; ' % (user.encode('utf8'), balance)
    string = string.rstrip('; ')
    print('\nData to hash: "%s"' % string)
    sha256 = hashlib.sha256(string).hexdigest()
    print('SHA256: %s' % sha256)
    num = float(int(sha256, 16)) / int('f'*64, 16)
    print('-> Pseudorandom number: %0.8f\n' % num)
    return num

def choose_winner(balances):
    # sort users and balances in decreasing order of balance
    balances = sort_balances(balances)

    total_balance = sum(balances.values())
    if total_balance == 0:
        return None

    rnd = int(get_pseudorandom_number(balances) * (total_balance-1))
    print('Total hashes: %d' % (total_balance))
    print('-> Scaled pseudorandom number = pseudo * (total-1): %d\n' % rnd)
    print('Address %s|   Hashes  |      Winning range' % (' '*26))
    # cumsum goes from 0 to total_value
    # rnd goes from 0 to total_value-1
    # if there are 2 users with 1 hash each:
    # rnd can be 0 or 1. cumsum = [1 2]
    # random number of 0 -> user 1. cumsum[1]=1 which is > 0, so user 1 is chosen
    # random number of 1 -> user 2. cumsum[1]=1 which is = 1, so user 1 is not chosen
    cumsum = 0
    winner = None
    for username, balance in balances.items():
        last_cumsum = cumsum
        cumsum = cumsum + balance
        winner_str = ''
        if cumsum > rnd and not winner:
            winner = username
            winner_str = '*'
        print('%s  %10d  %10d -> %10d %s' % (username, balance, last_cumsum, cumsum-1, winner_str))
    print('')
    return winner

def get_pseudorandom(balances):
    string = b''
    for i in range(0, len(balances)):
        string = string + b'%s, %0.0f; ' % (balances[i]['name'].encode('utf8'), balances[i]['balance'])
    string = string.rstrip('; ')
    print('\nData to hash: "%s"' % string)
    sha256 = hashlib.sha256(string).hexdigest()
    print('SHA256: %s' % sha256)
    num = float(int(sha256, 16)) / int('f'*64, 16)
    print('-> Pseudorandom number: %0.8f\n' % num)
    return num

balance = {"nextPage": null, "users": [{"total": 35840, "name": "1JdWWVSw3Q7oxYQZLSprbkDRmHMufFCijj", "hps": 0, "winning": 77, "balance": 35840, "withdrawn": 0}, {"balance": 7168, "name": "1PDEERcRmrXTPgmNKLqiv9ddvtokf7d2jk", "hps": 0, "winning": 15, "total": 7168, "withdrawn": 0}], "success": true}
get_pseudorandom(balance['users'])
