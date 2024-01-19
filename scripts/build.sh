#!/bin/bash

# Definire la cartella sorgente e il file da copiare
cartella_sorgente="./config/$1"
file_da_copiare="mta.yaml"
xssecurity="xs-security.json"

# Definire la cartella di destinazione
cartella_destinazione="./"



# Copiare il file dalla cartella sorgente alla cartella di destinazione
cp "$cartella_sorgente/$file_da_copiare" "$cartella_destinazione/$file_da_copiare"
cp "$cartella_sorgente/$xssecurity" "$cartella_destinazione/$xssecurity"

mbt build

echo "Setup + build completata"