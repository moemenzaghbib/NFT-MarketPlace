import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'
import { Form } from 'react-bootstrap';

const Home = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [email, setEmail] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const loadMarketplaceItems = async () => {
    // Load all unsold items
    const itemCount = await marketplace.itemCount()
    let items = []
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i)
      if (!item.sold) {
        const test = await nft.tokenURI(item.tokenId)
       const ipfsHash = test.split("ipfs/")[1];
       console.log(ipfsHash); // QmQtr6z2UnPH3TGjEPpXaCEVcssraa63oToEw9UPYC91dn
        const uri = "https://cloudflare-ipfs.com/ipfs/"+ipfsHash;
        console.log(uri);
        const response = await fetch(uri);
        const metadata = await response.json()
        // get uri url from nft contract
        // const uri = await nft.tokenURI(item.tokenId)
        // // use uri to fetch the nft metadata stored on ipfs 
        // const response = await fetch(uri)
        // const metadata = await response.json()
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(item.itemId)
        // Add item to items array
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image
        })
      }
    }
    setLoading(false)
    setItems(items)
  }
  const validateEmail = async (email) => {
    // Simple email validation using regex
    const regex = /\S+@\S+\.\S+/
    if (!regex.test(email)) {
      return false;
    }
    return regex.test(email)

    // Check if the email exists in the database
    // const response = await fetch(`/api/check-email?email=${email}`);
    // const data = await response.json();
    // return data.exists;
  }

  const handleEmailChange = (event) => {
    const newEmail = event.target.value
    setEmail(newEmail)
    setEmailValid(validateEmail(newEmail))
  }

  const buyMarketItem = async (item) => {
    if (!emailValid) {
      alert('Please enter a valid email address.')
      return
    }
    try {
          const response = await fetch('http://127.0.0.1:9090/user/checkIfUserExists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
          });
          if (response.ok) {
            try{
              await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
              const response = await fetch('http://127.0.0.1:9090/card/addCardToUser', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, name: item.name })
              });
              if (response.ok) {
                alert('Card Bought successfully')
              }
                
           
              setEmail('')
              setEmailValid(false)
              loadMarketplaceItems() 
               
            }
            catch (error) {
              return
              alert('The purchase failed```.')
              console.log('The purchase failed');
            }   
          
          
            
            // perform specific action here
          } else {
            alert('User with that email doesnt exist')
          }
       
     
      // the purchase was successful, so you can do the specific action here 
    } catch (error) {
      alert('The purchase failed```.')

      console.log('The purchase failed');
    }   
   }

  useEffect(() => {
    loadMarketplaceItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {items.length > 0 ?
        <div className="px-5 container">
           <Form>
            <Form.Group controlId="formEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter email" value={email} onChange={handleEmailChange} />
              <Form.Text className="text-muted">
                You need to enter the Email associeted with you Elemental Oddesey Account so the transcition can happen.
              </Form.Text>
            </Form.Group>
          </Form>
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {items.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Body color="secondary">
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>
                      {item.description}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className='d-grid'>
                      <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                        Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}
export default Home