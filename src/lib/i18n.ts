export type Language = "de" | "fr";

const translations: Record<string, Record<Language, string>> = {
  // Nav
  "nav.inventory": { de: "Inventar", fr: "Inventaire" },
  "nav.sell": { de: "Verkauf", fr: "Vente" },
  "nav.movements": { de: "Bewegungen", fr: "Mouvements" },
  "nav.report": { de: "Bericht", fr: "Rapport" },

  // Auth
  "auth.title": { de: "📚 BookBooth", fr: "📚 BookBooth" },
  "auth.signInSubtitle": { de: "Melden Sie sich bei Ihrem Konto an", fr: "Connectez-vous à votre compte" },
  "auth.signUpSubtitle": { de: "Neues Verkäuferkonto erstellen", fr: "Créer un nouveau compte vendeur" },
  "auth.email": { de: "E-Mail", fr: "E-mail" },
  "auth.password": { de: "Passwort", fr: "Mot de passe" },
  "auth.signIn": { de: "Anmelden", fr: "Se connecter" },
  "auth.signUp": { de: "Registrieren", fr: "S'inscrire" },
  "auth.createAccount": { de: "Konto erstellen", fr: "Créer un compte" },
  "auth.noAccount": { de: "Noch kein Konto?", fr: "Pas encore de compte ?" },
  "auth.hasAccount": { de: "Bereits ein Konto?", fr: "Déjà un compte ?" },
  "auth.checkEmail": { de: "Überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.", fr: "Vérifiez votre e-mail pour confirmer votre compte." },

  // Inventory
  "inv.title": { de: "📦 Inventar", fr: "📦 Inventaire" },
  "inv.subtitle": { de: "Scannen oder suchen um Bücher hinzuzufügen", fr: "Scanner ou rechercher pour ajouter des livres" },
  "inv.searchPlaceholder": { de: "Titel, Autor oder ISBN suchen...", fr: "Chercher par titre, auteur ou ISBN..." },
  "inv.noBooksFound": { de: "Keine Bücher gefunden", fr: "Aucun livre trouvé" },
  "inv.scanBarcode": { de: "Barcode scannen", fr: "Scanner le code-barres" },
  "inv.enterManually": { de: "Barcode manuell eingeben", fr: "Entrer le code-barres manuellement" },
  "inv.scannedBarcode": { de: "Gescannter Barcode", fr: "Code-barres scanné" },
  "inv.bookTitle": { de: "Buchtitel", fr: "Titre du livre" },
  "inv.enterTitle": { de: "Buchtitel eingeben", fr: "Entrer le titre du livre" },
  "inv.author": { de: "Autor", fr: "Auteur" },
  "inv.enterAuthor": { de: "Autorname eingeben", fr: "Entrer le nom de l'auteur" },
  "inv.salePrice": { de: "Verkaufspreis (CHF)", fr: "Prix de vente (CHF)" },
  "inv.quantity": { de: "Menge", fr: "Quantité" },
  "inv.addToInventory": { de: "Zum Inventar hinzufügen", fr: "Ajouter à l'inventaire" },
  "inv.bookAdded": { de: "Buch hinzugefügt!", fr: "Livre ajouté !" },
  "inv.currentStock": { de: "Aktueller Bestand", fr: "Stock actuel" },
  "inv.removeTitle": { de: "Entfernen", fr: "Supprimer" },
  "inv.removeConfirm": { de: "Dies entfernt das Buch dauerhaft aus Ihrem Inventar.", fr: "Cela supprimera définitivement ce livre de votre inventaire." },
  "inv.remove": { de: "Entfernen", fr: "Supprimer" },

  // POS / Sales
  "pos.title": { de: "💰 Verkauf", fr: "💰 Ventes" },
  "pos.searchPlaceholder": { de: "Buch nach Name suchen...", fr: "Chercher un livre par nom..." },
  "pos.scanToSell": { de: "SCANNEN ZUM VERKAUFEN", fr: "SCANNER POUR VENDRE" },
  "pos.available": { de: "verfügbar", fr: "disponible(s)" },
  "pos.discount": { de: "Rabatt (CHF)", fr: "Remise (CHF)" },
  "pos.cash": { de: "BAR", fr: "ESPÈCES" },
  "pos.card": { de: "KARTE", fr: "CARTE" },
  "pos.twint": { de: "TWINT", fr: "TWINT" },
  "pos.totalDue": { de: "Gesamtbetrag", fr: "Total dû" },
  "pos.amountReceived": { de: "Erhaltener Betrag (CHF)", fr: "Montant reçu (CHF)" },
  "pos.changeToGive": { de: "Rückgeld", fr: "Monnaie à rendre" },
  "pos.amountLess": { de: "Betrag ist weniger als der Gesamtbetrag", fr: "Le montant est inférieur au total" },
  "pos.confirmCash": { de: "BARZAHLUNG BESTÄTIGEN", fr: "CONFIRMER PAIEMENT ESPÈCES" },
  "pos.saleComplete": { de: "Verkauf abgeschlossen!", fr: "Vente effectuée !" },
  "pos.paymentRecorded": { de: "Zahlung erfasst", fr: "Paiement enregistré" },
  "pos.outOfStock": { de: "ist nicht auf Lager!", fr: "est en rupture de stock !" },
  "pos.notFound": { de: "Buch nicht im Inventar gefunden. Bitte zuerst im Inventar hinzufügen.", fr: "Livre non trouvé. Veuillez d'abord l'ajouter à l'inventaire." },

  // Movements
  "mov.title": { de: "Bewegungen", fr: "Mouvements" },
  "mov.subtitle": { de: "Dépôt, Pilon, SP, Auteur, Internet", fr: "Dépôt, Pilon, SP, Auteur, Internet" },
  "mov.searchPlaceholder": { de: "Buch suchen...", fr: "Chercher un livre..." },
  "mov.scanForMovement": { de: "SCANNEN FÜR BEWEGUNG", fr: "SCANNER POUR MOUVEMENT" },
  "mov.selectType": { de: "Bewegungstyp wählen", fr: "Choisir le type de mouvement" },
  "mov.movementType": { de: "Bewegungstyp", fr: "Type de mouvement" },
  "mov.returningToStock": { de: "Zurück ins Lager", fr: "Retour en stock" },
  "mov.inStock": { de: "auf Lager", fr: "en stock" },
  "mov.notePlaceholder": { de: "Notiz (z.B. Distributorname)...", fr: "Note (ex. nom du distributeur)..." },
  "mov.noRevenue": { de: "Kein Umsatz erfasst (CHF 0.00)", fr: "Aucun revenu enregistré (CHF 0.00)" },
  "mov.confirm": { de: "BESTÄTIGEN", fr: "CONFIRMER" },
  "mov.recorded": { de: "Bewegung erfasst!", fr: "Mouvement enregistré !" },
  "mov.notFoundError": { de: "Buch nicht im Inventar gefunden.", fr: "Livre non trouvé dans l'inventaire." },
  "mov.failedRecord": { de: "Bewegung konnte nicht erfasst werden. Bestand prüfen.", fr: "Échec de l'enregistrement. Vérifiez le stock." },
  "mov.failedGeneric": { de: "Fehler bei der Erfassung. Bestand prüfen.", fr: "Échec de l'enregistrement. Vérifiez le stock." },

  // Movement types
  "movType.depot_deposit": { de: "Dépôt – Einlieferung", fr: "Dépôt – Dépôt" },
  "movType.depot_deposit.desc": { de: "Bücher an Distributor senden", fr: "Envoyer des livres au distributeur" },
  "movType.depot_sold": { de: "Dépôt – Verkauft", fr: "Dépôt – Vendu" },
  "movType.depot_sold.desc": { de: "Distributor hat Bücher verkauft (Umsatz)", fr: "Le distributeur a vendu des livres (revenu)" },
  "movType.depot_return": { de: "Dépôt – Rückgabe", fr: "Dépôt – Retour" },
  "movType.depot_return.desc": { de: "Unverkaufte Bücher zurück ins Lager", fr: "Livres invendus retournés en stock" },
  "movType.auteur": { de: "Auteur", fr: "Auteur" },
  "movType.auteur.desc": { de: "Autorenexemplare (mit Zahlung)", fr: "Exemplaires d'auteur (avec paiement)" },
  "movType.internet": { de: "Internet", fr: "Internet" },
  "movType.internet.desc": { de: "Online- / Webbestellungen", fr: "Commandes en ligne / web" },
  "movType.pilon": { de: "Pilon", fr: "Pilon" },
  "movType.pilon.desc": { de: "Beschädigt / entsorgt (CHF 0)", fr: "Endommagé / détruit (CHF 0)" },
  "movType.sp": { de: "SP (Presse)", fr: "SP (Presse)" },
  "movType.sp.desc": { de: "Werbe- / Marketinggeschenk (CHF 0)", fr: "Cadeau promo / marketing (CHF 0)" },

  // Transaction labels (for dashboard)
  "tx.retail": { de: "Einzelhandel", fr: "Vente au détail" },
  "tx.depot_deposit": { de: "Dépôt – Einlieferung", fr: "Dépôt – Dépôt" },
  "tx.depot_sold": { de: "Dépôt – Verkauft", fr: "Dépôt – Vendu" },
  "tx.depot_return": { de: "Dépôt – Rückgabe", fr: "Dépôt – Retour" },
  "tx.auteur": { de: "Auteur", fr: "Auteur" },
  "tx.internet": { de: "Internet", fr: "Internet" },
  "tx.pilon": { de: "Pilon", fr: "Pilon" },
  "tx.sp": { de: "SP (Presse)", fr: "SP (Presse)" },

  // Dashboard
  "dash.title": { de: "📊 Dashboard", fr: "📊 Tableau de bord" },
  "dash.overview": { de: "Übersicht", fr: "Aperçu" },
  "dash.signOut": { de: "Abmelden", fr: "Déconnexion" },
  "dash.revenue": { de: "Umsatz", fr: "Revenus" },
  "dash.totalRevenue": { de: "Gesamtumsatz", fr: "Revenu total" },
  "dash.sales": { de: "Verkäufe", fr: "ventes" },
  "dash.cash": { de: "Bar", fr: "Espèces" },
  "dash.card": { de: "Karte", fr: "Carte" },
  "dash.twint": { de: "Twint", fr: "Twint" },
  "dash.byCategory": { de: "Nach Kategorie", fr: "Par catégorie" },
  "dash.export": { de: "Export", fr: "Export" },
  "dash.stockAdjustments": { de: "Bestandsanpassungen", fr: "Ajustements de stock" },
  "dash.movements": { de: "Bewegungen", fr: "mouvements" },
  "dash.lowStock": { de: "Niedrige Bestände", fr: "Stock bas" },
  "dash.left": { de: "übrig", fr: "restant(s)" },
  "dash.transactions": { de: "Transaktionen", fr: "Transactions" },
  "dash.csv": { de: "CSV", fr: "CSV" },
  "dash.from": { de: "Von", fr: "Du" },
  "dash.to": { de: "Bis", fr: "Au" },
  "dash.noTransactions": { de: "Keine Transaktionen", fr: "Aucune transaction" },
  "dash.noTransactionsForDates": { de: "Keine Transaktionen für ausgewählte Daten", fr: "Aucune transaction pour les dates sélectionnées" },
  "dash.noTransactionsYet": { de: "Noch keine Transaktionen", fr: "Aucune transaction pour le moment" },

  // Book info
  "book.noCover": { de: "Kein Cover", fr: "Pas de couverture" },
  "book.inStock": { de: "auf Lager", fr: "en stock" },

  // Scanner
  "scanner.tryAgain": { de: "Erneut versuchen", fr: "Réessayer" },
  "scanner.cameraUnavailable": { de: "Kamera nicht verfügbar. Bitte Kamerazugriff erlauben.", fr: "Caméra indisponible. Veuillez autoriser l'accès à la caméra." },
  "scanner.cameraDenied": { de: "Kamerazugriff verweigert. Bitte Browsereinstellungen prüfen.", fr: "Accès caméra refusé. Vérifiez les paramètres du navigateur." },
  "scanner.hint": { de: "Barcode 15–25 cm vor die Kamera halten", fr: "Tenir le code-barres à 15–25 cm de la caméra" },

  // Common
  "common.cancel": { de: "Abbrechen", fr: "Annuler" },
  "common.back": { de: "Zurück", fr: "Retour" },
  "common.tryAgain": { de: "Erneut versuchen", fr: "Réessayer" },
};

export function getTranslation(key: string, lang: Language): string {
  return translations[key]?.[lang] ?? key;
}
