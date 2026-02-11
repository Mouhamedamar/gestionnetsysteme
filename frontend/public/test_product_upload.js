/**
 * SCRIPT DE TEST - À EXÉCUTER DANS LA CONSOLE (F12)
 * 
 * Testez l'envoi d'un produit avec photo
 */

console.log("=".repeat(70));
console.log("TEST D'ENVOI DE PRODUIT AVEC PHOTO");
console.log("=".repeat(70));

// Fonction pour simuler un upload
async function testProductUpload() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error("❌ Pas de token trouvé! Connectez-vous d'abord.");
    return;
  }
  
  console.log("✓ Token trouvé");

  // Créer les données du formulaire
  const formData = new FormData();
  formData.append('name', 'Test Product Console');
  formData.append('description', 'Produit créé depuis la console');
  formData.append('category', 'Test');
  formData.append('quantity', 5);
  formData.append('purchase_price', 100);
  formData.append('sale_price', 150);
  formData.append('alert_threshold', 2);
  formData.append('is_active', true);

  // Créer une image de test (petit PNG rouge)
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 100, 100);
  
  canvas.toBlob(blob => {
    formData.append('photo', blob, 'test_console.png');
    
    console.log("\n1. DONNÉES À ENVOYER");
    console.log("-".repeat(70));
    for (let [key, value] of formData) {
      if (value instanceof Blob) {
        console.log(`  ${key}: File (${value.size} bytes, type: ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Envoyer la requête
    console.log("\n2. ENVOI DE LA REQUÊTE");
    console.log("-".repeat(70));
    
    fetch('http://localhost:8000/api/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    .then(res => {
      console.log(`✓ Réponse reçue: Status ${res.status}`);
      console.log(`  Headers Content-Type: ${res.headers.get('content-type')}`);
      return res.json();
    })
    .then(data => {
      console.log("\n3. RÉPONSE");
      console.log("-".repeat(70));
      console.log("✓ Succès!");
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      console.error("\n❌ ERREUR");
      console.error("-".repeat(70));
      console.error(err);
    });
  });
}

// Exécuter le test
console.log("\nExécution du test...\n");
testProductUpload();
