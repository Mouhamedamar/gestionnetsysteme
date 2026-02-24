/**
 * DIAGNOSTIC DES IMAGES - À EXÉCUTER DANS LA CONSOLE DU NAVIGATEUR (F12)
 * 
 * Copiez ce code et exécutez-le dans la console du navigateur
 */

console.log("=".repeat(70));
console.log("DIAGNOSTIC DES IMAGES - PRODUITS");
console.log("=".repeat(70));

// 1. Vérifier les produits en mémoire
console.log("\n1. PRODUITS EN MÉMOIRE");
console.log("-".repeat(70));

// Récupérer via l'API
fetch('http://localhost:8000/api/products/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(res => res.json())
.then(data => {
  const products = data.results || data;
  console.log(`Total: ${products.length} produits`);
  
  const with_photo = products.filter(p => p.photo_url || p.photo);
  const without_photo = products.filter(p => !p.photo_url && !p.photo);
  
  console.log(`✓ Avec photo: ${with_photo.length}`);
  console.log(`✗ SANS photo: ${without_photo.length}`);
  
  // Afficher les premiers produits avec photo
  if (with_photo.length > 0) {
    console.log("\n2. EXEMPLES D'URLS");
    console.log("-".repeat(70));
    with_photo.slice(0, 3).forEach((p, i) => {
      console.log(`\nProduit ${i + 1}: ${p.name}`);
      console.log(`  ID: ${p.id}`);
      console.log(`  photo: ${p.photo}`);
      console.log(`  photo_url: ${p.photo_url}`);
      
      // Tester l'accès à l'URL
      if (p.photo_url) {
        console.log(`  Testage: ${p.photo_url}`);
        fetch(p.photo_url)
          .then(res => {
            console.log(`    → Status: ${res.status}`);
            console.log(`    → Content-Type: ${res.headers.get('content-type')}`);
          })
          .catch(err => console.log(`    → Erreur: ${err.message}`));
      }
    });
  }
  
  // Vérifier directement les images
  console.log("\n3. ACCÈS DIRECT AUX IMAGES");
  console.log("-".repeat(70));
  
  const test_urls = [
    'http://localhost:8000/media/products/product_1_wifi.jpg',
    'http://localhost:8000/media/products/product_11_amar.jpg'
  ];
  
  test_urls.forEach(url => {
    fetch(url)
      .then(res => {
        console.log(`${url.split('/').pop()}: ${res.status}`);
      })
      .catch(err => {
        console.log(`${url.split('/').pop()}: ERREUR - ${err.message}`);
      });
  });
  
})
.catch(err => {
  console.error("ERREUR lors de la récupération:", err);
});

// 4. Vérifier les fichiers chargés dans le DOM
console.log("\n4. IMAGES DANS LE DOM");
console.log("-".repeat(70));
setTimeout(() => {
  const images = document.querySelectorAll('img');
  console.log(`Nombre d'images dans le DOM: ${images.length}`);
  
  images.forEach((img, i) => {
    if (i < 5) {
      console.log(`\nImage ${i + 1}:`);
      console.log(`  src: ${img.src}`);
      console.log(`  alt: ${img.alt}`);
      console.log(`  loaded: ${img.complete && img.naturalHeight > 0}`);
    }
  });
}, 2000);

console.log("\n" + "=".repeat(70));
console.log("Fin du diagnostic. Vérifiez les autres onglets (Network, etc.)");
console.log("=".repeat(70));
