from bs4 import BeautifulSoup
from requests import get
URL='https://visitbydgoszcz.pl/pl/odkryj/co-zobaczyc/3555-zabytki-w-bydgoszczy'
page=get(URL)
bs=BeautifulSoup(page.content, 'html.parser')
zabytki=[]
for offer in bs.find_all('strong'):
    tekst = offer.text.strip() # Najpierw czyścimy spacje
    if not tekst:
        continue
    if len(tekst)< 3 or len(tekst)>100:
        continue
    if tekst[0].isdigit():
        continue
    zabytki.append(tekst)

artykul=bs.find('div',class_='articleBody')
for p in bs.find_all('p', style="text-align: justify;"):
    print(p.get_text(separator=" ", strip=True))




