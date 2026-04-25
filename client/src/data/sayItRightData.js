export const SAY_IT_RIGHT_DATA = {
  Shopping: {
    Beginner: [
      { id: 's_b_1', original: "How much is this?", expectedTranslation: { Spanish: "¿Cuánto cuesta esto?", French: "Combien ça coûte?", German: "Wie viel kostet das?" } },
      { id: 's_b_2', original: "I want to buy a shirt.", expectedTranslation: { Spanish: "Quiero comprar una camisa.", French: "Je veux acheter une chemise.", German: "Ich möchte ein Hemd kaufen." } },
      { id: 's_b_3', original: "Do you have this in blue?", expectedTranslation: { Spanish: "¿Tienes esto en azul?", French: "Avez-vous ça en bleu?", German: "Haben Sie das in Blau?" } },
      { id: 's_b_4', original: "Where is the fitting room?", expectedTranslation: { Spanish: "¿Dónde está el probador?", French: "Où est la cabine d'essayage?", German: "Wo ist die Umkleidekabine?" } },
      { id: 's_b_5', original: "It is too expensive.", expectedTranslation: { Spanish: "Es demasiado caro.", French: "C'est trop cher.", German: "Das ist zu teuer." } }
    ],
    Intermediate: [
      { id: 's_i_1', original: "Do you accept credit cards here?", expectedTranslation: { Spanish: "¿Aceptan tarjetas de crédito aquí?", French: "Acceptez-vous les cartes de crédit ici?", German: "Akzeptieren Sie hier Kreditkarten?" } },
      { id: 's_i_2', original: "Can I get a discount on this item?", expectedTranslation: { Spanish: "¿Puedo obtener un descuento en este artículo?", French: "Puis-je avoir une réduction sur cet article?", German: "Kann ich einen Rabatt auf diesen Artikel bekommen?" } },
      { id: 's_i_3', original: "I am just looking around, thank you.", expectedTranslation: { Spanish: "Solo estoy mirando, gracias.", French: "Je regarde juste, merci.", German: "Ich schaue mich nur um, danke." } },
      { id: 's_i_4', original: "What time does the store close today?", expectedTranslation: { Spanish: "¿A qué hora cierra la tienda hoy?", French: "À quelle heure le magasin ferme-t-il aujourd'hui?", German: "Wann schließt das Geschäft heute?" } },
      { id: 's_i_5', original: "I would like to return these shoes.", expectedTranslation: { Spanish: "Me gustaría devolver estos zapatos.", French: "Je voudrais retourner ces chaussures.", German: "Ich möchte diese Schuhe zurückgeben." } }
    ]
  },
  Food: {
    Beginner: [
      { id: 'f_b_1', original: "I would like a table for two.", expectedTranslation: { Spanish: "Quisiera una mesa para dos.", French: "Je voudrais une table pour deux.", German: "Ich hätte gerne einen Tisch für zwei." } },
      { id: 'f_b_2', original: "Can I see the menu, please?", expectedTranslation: { Spanish: "¿Puedo ver el menú, por favor?", French: "Puis-je voir le menu, s'il vous plaît?", German: "Kann ich bitte die Speisekarte sehen?" } },
      { id: 'f_b_3', original: "I am vegetarian.", expectedTranslation: { Spanish: "Soy vegetariano.", French: "Je suis végétarien.", German: "Ich bin Vegetarier." } },
      { id: 'f_b_4', original: "The food is delicious.", expectedTranslation: { Spanish: "La comida es deliciosa.", French: "La nourriture est délicieuse.", German: "Das Essen ist köstlich." } },
      { id: 'f_b_5', original: "Check, please.", expectedTranslation: { Spanish: "La cuenta, por favor.", French: "L'addition, s'il vous plaît.", German: "Die Rechnung, bitte." } }
    ],
    Intermediate: [
      { id: 'f_i_1', original: "What do you recommend for dinner?", expectedTranslation: { Spanish: "¿Qué recomiendas para la cena?", French: "Que recommandez-vous pour le dîner?", German: "Was empfehlen Sie zum Abendessen?" } },
      { id: 'f_i_2', original: "Does this dish have peanuts in it?", expectedTranslation: { Spanish: "¿Este plato tiene cacahuetes?", French: "Ce plat contient-il des cacahuètes?", German: "Enthält dieses Gericht Erdnüsse?" } },
      { id: 'f_i_3', original: "We have a reservation under the name John.", expectedTranslation: { Spanish: "Tenemos una reserva a nombre de John.", French: "Nous avons une réservation au nom de John.", German: "Wir haben eine Reservierung auf den Namen John." } },
      { id: 'f_i_4', original: "Could you bring us some more water?", expectedTranslation: { Spanish: "¿Podrías traernos un poco más de agua?", French: "Pourriez-vous nous apporter encore un peu d'eau?", German: "Könnten Sie uns noch etwas Wasser bringen?" } },
      { id: 'f_i_5', original: "I would like my steak medium rare.", expectedTranslation: { Spanish: "Me gustaría mi filete en su punto.", French: "Je voudrais mon steak à point.", German: "Ich hätte mein Steak gerne medium." } }
    ]
  },
  Travel: {
    Beginner: [
      { id: 't_b_1', original: "Where is the bathroom?", expectedTranslation: { Spanish: "¿Dónde está el baño?", French: "Où sont les toilettes?", German: "Wo ist die Toilette?" } },
      { id: 't_b_2', original: "I need a taxi to the airport.", expectedTranslation: { Spanish: "Necesito un taxi al aeropuerto.", French: "J'ai besoin d'un taxi pour l'aéroport.", German: "Ich brauche ein Taxi zum Flughafen." } },
      { id: 't_b_3', original: "How far is the hotel?", expectedTranslation: { Spanish: "¿A qué distancia está el hotel?", French: "À quelle distance se trouve l'hôtel?", German: "Wie weit ist das Hotel?" } },
      { id: 't_b_4', original: "Where is the train station?", expectedTranslation: { Spanish: "¿Dónde está la estación de tren?", French: "Où est la gare?", German: "Wo ist der Bahnhof?" } },
      { id: 't_b_5', original: "Help me, I am lost.", expectedTranslation: { Spanish: "Ayúdame, estoy perdido.", French: "Aidez-moi, je suis perdu.", German: "Helfen Sie mir, ich habe mich verlaufen." } }
    ],
    Intermediate: [
      { id: 't_i_1', original: "Is there a direct flight to Berlin?", expectedTranslation: { Spanish: "¿Hay un vuelo directo a Berlín?", French: "Y a-t-il un vol direct pour Berlin?", German: "Gibt es einen Direktflug nach Berlin?" } },
      { id: 't_i_2', original: "Can I leave my luggage here until noon?", expectedTranslation: { Spanish: "¿Puedo dejar mi equipaje aquí hasta el mediodía?", French: "Puis-je laisser mes bagages ici jusqu'à midi?", German: "Kann ich mein Gepäck hier bis Mittag lassen?" } },
      { id: 't_i_3', original: "Which platform does the train leave from?", expectedTranslation: { Spanish: "¿De qué andén sale el tren?", French: "De quel quai le train part-il?", German: "Von welchem Gleis fährt der Zug ab?" } },
      { id: 't_i_4', original: "Could you show me where we are on the map?", expectedTranslation: { Spanish: "¿Podría mostrarme dónde estamos en el mapa?", French: "Pourriez-vous me montrer où nous sommes sur la carte?", German: "Könnten Sie mir zeigen, wo wir auf der Karte sind?" } },
      { id: 't_i_5', original: "What time is boarding for this flight?", expectedTranslation: { Spanish: "¿A qué hora es el embarque para este vuelo?", French: "À quelle heure est l'embarquement pour ce vol?", German: "Wann ist das Boarding für diesen Flug?" } }
    ]
  },
  Office: {
    Beginner: [
      { id: 'o_b_1', original: "I have a meeting at ten.", expectedTranslation: { Spanish: "Tengo una reunión a las diez.", French: "J'ai une réunion à dix heures.", German: "Ich habe um zehn Uhr ein Meeting." } },
      { id: 'o_b_2', original: "Where is my desk?", expectedTranslation: { Spanish: "¿Dónde está mi escritorio?", French: "Où est mon bureau?", German: "Wo ist mein Schreibtisch?" } },
      { id: 'o_b_3', original: "Can you send me the email?", expectedTranslation: { Spanish: "¿Puedes enviarme el correo electrónico?", French: "Pouvez-vous m'envoyer l'e-mail?", German: "Können Sie mir die E-Mail senden?" } },
      { id: 'o_b_4', original: "The internet is not working.", expectedTranslation: { Spanish: "El internet no funciona.", French: "Internet ne fonctionne pas.", German: "Das Internet funktioniert nicht." } },
      { id: 'o_b_5', original: "I need to print this document.", expectedTranslation: { Spanish: "Necesito imprimir este documento.", French: "J'ai besoin d'imprimer ce document.", German: "Ich muss dieses Dokument drucken." } }
    ],
    Intermediate: [
      { id: 'o_i_1', original: "Let's schedule a call for tomorrow morning.", expectedTranslation: { Spanish: "Programemos una llamada para mañana por la mañana.", French: "Planifions un appel pour demain matin.", German: "Lassen Sie uns einen Anruf für morgen früh planen." } },
      { id: 'o_i_2', original: "Could you please review this report by Friday?", expectedTranslation: { Spanish: "¿Podrías revisar este informe para el viernes?", French: "Pourriez-vous examiner ce rapport d'ici vendredi?", German: "Könnten Sie diesen Bericht bitte bis Freitag überprüfen?" } },
      { id: 'o_i_3', original: "We need to push the deadline back a few days.", expectedTranslation: { Spanish: "Necesitamos retrasar la fecha límite unos días.", French: "Nous devons repousser la date limite de quelques jours.", German: "Wir müssen die Frist um einige Tage verschieben." } },
      { id: 'o_i_4', original: "I will be out of the office on vacation next week.", expectedTranslation: { Spanish: "Estaré fuera de la oficina de vacaciones la próxima semana.", French: "Je serai absent du bureau en vacances la semaine prochaine.", German: "Ich bin nächste Woche im Urlaub und nicht im Büro." } },
      { id: 'o_i_5', original: "Please find the attached presentation for your review.", expectedTranslation: { Spanish: "Por favor, encuentre la presentación adjunta para su revisión.", French: "Veuillez trouver la présentation ci-jointe pour votre examen.", German: "Bitte finden Sie die beigefügte Präsentation zur Überprüfung." } }
    ]
  },
  Social: {
    Beginner: [
      { id: 'soc_b_1', original: "Nice to meet you.", expectedTranslation: { Spanish: "Encantado de conocerte.", French: "Ravi de vous rencontrer.", German: "Freut mich, Sie kennenzulernen." } },
      { id: 'soc_b_2', original: "How are you doing today?", expectedTranslation: { Spanish: "¿Cómo estás hoy?", French: "Comment allez-vous aujourd'hui?", German: "Wie geht es Ihnen heute?" } },
      { id: 'soc_b_3', original: "What is your name?", expectedTranslation: { Spanish: "¿Cómo te llamas?", French: "Comment vous appelez-vous?", German: "Wie heißen Sie?" } },
      { id: 'soc_b_4', original: "Where are you from?", expectedTranslation: { Spanish: "¿De dónde eres?", French: "D'où venez-vous?", German: "Woher kommen Sie?" } },
      { id: 'soc_b_5', original: "I like your shoes.", expectedTranslation: { Spanish: "Me gustan tus zapatos.", French: "J'aime tes chaussures.", German: "Ich mag Ihre Schuhe." } }
    ],
    Intermediate: [
      { id: 'soc_i_1', original: "What do you like to do in your free time?", expectedTranslation: { Spanish: "¿Qué te gusta hacer en tu tiempo libre?", French: "Qu'aimez-vous faire pendant votre temps libre?", German: "Was machen Sie gerne in Ihrer Freizeit?" } },
      { id: 'soc_i_2', original: "We should definitely grab a coffee sometime.", expectedTranslation: { Spanish: "Definitivamente deberíamos tomar un café algún día.", French: "Nous devrions certainement prendre un café un de ces jours.", German: "Wir sollten unbedingt mal einen Kaffee trinken." } },
      { id: 'soc_i_3', original: "It was really great catching up with you.", expectedTranslation: { Spanish: "Fue genial ponerme al día contigo.", French: "C'était vraiment super de prendre de tes nouvelles.", German: "Es war wirklich schön, sich mit dir auszutauschen." } },
      { id: 'soc_i_4', original: "Are you going to the party this weekend?", expectedTranslation: { Spanish: "¿Vas a ir a la fiesta este fin de semana?", French: "Vas-tu à la fête ce week-end?", German: "Gehst du am Wochenende zur Party?" } },
      { id: 'soc_i_5', original: "How long have you been living in this city?", expectedTranslation: { Spanish: "¿Cuánto tiempo llevas viviendo en esta ciudad?", French: "Depuis combien de temps vivez-vous dans cette ville?", German: "Wie lange wohnen Sie schon in dieser Stadt?" } }
    ]
  }
};
