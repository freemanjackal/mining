import requests
import json
import threading
import hashlib
import datetime
import time

def mining_statistics():
    payload = {'secret': 'yevJGBSLcCU8yPL0BaX6ELA4HbWlOMhd'}
    statistics = requests.get('https://api.coinhive.com/user/list', params = payload)
    statistics = statistics.json()
    return statistics
    
def site_statistics():
    payload = {'secret': 'yevJGBSLcCU8yPL0BaX6ELA4HbWlOMhd'}
    statistics = requests.get('https://api.coinhive.com/stats/site', params = payload)
    statistics = statistics.json()
    return statistics

def site_payout():
    payload = {'secret': 'yevJGBSLcCU8yPL0BaX6ELA4HbWlOMhd'}
    statistics = requests.get('https://api.coinhive.com/stats/payout', params = payload)
    statistics = statistics.json()
    return statistics    
    
    
def save_data(url , data):
    with open(url, 'w') as outfile:
        json.dump(data, outfile)

#read data from site
def readData():
    mining_data = mining_statistics()
    site_data = site_statistics()
    save_data('../js/site_stats.json', site_data)
    data = json.load(open('../js/statistics_users.json'))
    data_after_payment = json.load(open('../js/payed-xmr-pending.json'))
 # make all the changes here in .json to avoid modify in .js  
    if 'users' not in data.keys():
        print '11'
        for i in range(0, len(mining_data['users'])):
            hps = (mining_data['users'][i]['balance']-mining_data['users'][i]['balance'])/58
            mining_data['users'][i]['hps'] = hps
            if(site_data['hashesTotal'] - data_after_payment[1] == 0):
                mining_data['users'][i]['winning'] = 100
            else:
                mining_data['users'][i]['winning'] = mining_data['users'][i]['balance']*100/(site_data['hashesTotal'] - data_after_payment[1])
        save_data('../js/statistics_users.json', mining_data)
    else:
        
        for name in mining_data['users']:
            first_or_default = next((x for x in data['users'] if name['name']==x['name']), None)
            if first_or_default != None:
                hps = (name['balance'] - first_or_default['balance']) / 58
                first_or_default['balance'] = name['balance']
                first_or_default['total'] = name['total']
                first_or_default['hps'] = hps
                first_or_default['winning'] = first_or_default['balance']*100/(site_data['hashesTotal'] - data_after_payment[1])
            else:
                name['hps'] = 0
                name['winning'] = 0
                
                data['users'].append(name)
        save_data('../js/statistics_users.json', data)
    payout_stats = site_payout()
    usd = calculate_xmr_usd(site_data['xmrPending'] - data_after_payment[0], payout_stats['xmrToUsd'])
    if(usd[0] >= 0.30):
        #data = json.load(ousdpen('../js/statistics_users.json'))
        winner = set_winner(data['users'])
        save_winner(winner, usd[1])
        save_data('../js/payed-xmr-pending.json', [site_data['xmrPending'], site_data['hashesTotal']])
        reset()
        
def reset():
    payload = {'secret': 'yevJGBSLcCU8yPL0BaX6ELA4HbWlOMhd'}
    requests.post('https://api.coinhive.com/user/reset-all', params = payload)
    save_data('../js/site_stats.json', {})
    save_data('../js/statistics_users.json', {})
      

def save_winner(winner, amount):
    data = json.load(open('../js/payments.json'))
    winner_array = [winner, amount, int(time.time()), 'pending', 'none']
    data.append(winner_array)
    save_data('../js/payments.json', data)
    
def calculate_xmr_usd(xmr, usd):
    data = json.load(open('../js/payed-xmr-pending.json'))
    if(xmr < 0):
        save_data('../js/payed-xmr-pending.json', [0,0])        
        #return xmr*usd
    else:
        xmr = xmr-data[0]

    return [xmr*usd, xmr]

def timing():
    readData()
    threading.Timer(60.0, timing).start()

    
    
def get_pseudorandom(balances):
    string = b''
    print(balances[0])
    for i in range(0, len(balances)):
        string = string + b'%s, %0.0f; ' % (balances[i]['name'].encode('utf8'), balances[i]['balance'])
    string = string.rstrip('; ')
    print('\nData to hash: "%s"' % string)
    sha256 = hashlib.sha256(string).hexdigest()
    print('SHA256: %s' % sha256)
    num = float(int(sha256, 16)) / int('f'*64, 16)
    print('-> Pseudorandom number: %0.8f\n' % num)
    return num
    
def set_winner(balances):
    # sort users and balances in decreasing order of balance
    balances = sort_balances(balances)

    total_balance = sum(item['balance'] for item in balances)
    if total_balance == 0:
        return None

    rnd = int(get_pseudorandom(balances) * (total_balance-1))
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
    for i in range(0,len(balances)):
        last_cumsum = cumsum
        cumsum = cumsum + balances[i]['balance']
        winner_str = ''
        if cumsum > rnd and not winner:
            winner = balances[i]['name']
            winner_str = '*'
        print('%s  %10d  %10d -> %10d %s' % (balances[i]['name'], balances[i]['balance'], last_cumsum, cumsum-1, winner_str))
    print('')
    print winner
    print rnd
    return winner


def getKey(item):
    return item['balance']
    
def sort_balances(balances):
    bb =sorted(balances, key=getKey)
    return bb
    
timing()
#site_payout();    
#save_data('asd', mining_statistics())

#readData()
