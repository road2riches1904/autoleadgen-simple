export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { industry, location, companySize, keywords } = req.body;
  
  // Get Apollo API key from environment
  const apolloApiKey = process.env.APOLLO_API_KEY;
  
  if (!apolloApiKey) {
    // Fallback to demo data if no API key
    return res.json({
      leads: [
        {
          id: Date.now(),
          name: "Demo Company Inc",
          email: "contact@democompany.com",
          industry: industry || "Technology",
          score: 95,
          status: "Hot",
          value: "$5,000",
          phone: "+1 (555) 123-4567",
          website: "www.democompany.com"
        },
        {
          id: Date.now() + 1,
          name: "Sample Business LLC",
          email: "sales@samplebiz.com", 
          industry: industry || "Marketing",
          score: 88,
          status: "Warm",
          value: "$3,200",
          phone: "+1 (555) 987-6543",
          website: "www.samplebiz.com"
        }
      ]
    });
  }

  try {
    // Apollo.io API call
    const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloApiKey
      },
      body: JSON.stringify({
        q_organization_domains: [],
        page: 1,
        per_page: 10,
        organization_locations: location ? [location] : ["United States"],
        organization_industries: industry ? [industry] : ["Technology", "Software"],
        organization_num_employees_ranges: companySize ? [companySize] : ["1,10", "11,50", "51,200"],
        person_titles: keywords ? [keywords] : ["CEO", "Founder", "VP", "Director", "Manager"],
        q_keywords: keywords || ""
      })
    });

    const apolloData = await apolloResponse.json();
    
    if (apolloData.people && apolloData.people.length > 0) {
      // Transform Apollo data to our format
      const leads = apolloData.people.map((person, index) => ({
        id: Date.now() + index,
        name: person.organization?.name || "Unknown Company",
        email: person.email || "Email not available",
        industry: person.organization?.industry || industry || "Unknown",
        score: Math.floor(Math.random() * 20) + 80, // Random score 80-100
        status: index < 3 ? "Hot" : index < 6 ? "Warm" : "Cold",
        value: `$${(Math.floor(Math.random() * 5) + 2) * 1000}`,
        phone: person.phone_numbers?.[0]?.sanitized_number || "Phone not available",
        website: person.organization?.website_url || "Website not available",
        title: person.title || "Unknown Title",
        location: person.city && person.state ? `${person.city}, ${person.state}` : "Location not available"
      }));

      return res.json({ leads });
    } else {
      // Return demo data if no Apollo results
      return res.json({
        leads: [
          {
            id: Date.now(),
            name: "No Results Company",
            email: "noresults@example.com",
            industry: industry || "Technology",
            score: 75,
            status: "Cold",
            value: "$1,500",
            phone: "No phone available",
            website: "No website available"
          }
        ]
      });
    }
  } catch (error) {
    console.error('Apollo API Error:', error);
    
    // Return demo data on error
    return res.json({
      leads: [
        {
          id: Date.now(),
          name: "Error Recovery Company",
          email: "error@example.com",
          industry: industry || "Technology", 
          score: 70,
          status: "Cold",
          value: "$2,000",
          phone: "API Error",
          website: "API Error"
        }
      ]
    });
  }
}
