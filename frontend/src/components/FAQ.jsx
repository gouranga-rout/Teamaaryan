import React, { useState } from 'react';

const faqs = [
  {
    question: "What is RichIND and Team Aaryan?",
    answer:
      "RichIND is an Ed-Tech platform that provides educational resources along with opportunities to earn through affiliate-based programs. Team Aaryan is a supportive community that offers step-by-step guidance to help members understand the platform and achieve their goals."
  },
  {
    question: "Do I need to make an investment?",
    answer:
      "Yes. To participate in the affiliate program and access the available earning opportunities, a small one-time enrollment fee is required. Packages start from ₹260."
  },
  {
    question: "What kind of work is involved?",
    answer:
      "Your role is to introduce interested individuals to the platform and share information about the available learning and earning opportunities. Similar to recommending a useful service, you simply help others discover the platform."
  },
  {
    question: "How can I start earning?",
    answer:
      "After joining Team Aaryan, you will receive complete guidance and training on how to connect with like-minded individuals who are interested in learning and earning opportunities through the platform."
  },
  {
    question: "Will I receive payments directly in my bank account?",
    answer:
      "Yes. Commissions are credited directly to your registered bank account based on the package and referrals generated through your network, subject to the platform’s payment policies."
  }
];


const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <div className="accordion-container">
      <div className="accordion-heading"><h1>FREQUENTLY ASKED QUESTIONS</h1></div>
      {faqs.map((faq, i) => (
        <div key={i} className={`accordion ${activeIndex === i ? 'active' : ''}`}>
          <div className="question" onClick={() => setActiveIndex(i === activeIndex ? null : i)}>
            <h4>&nbsp;{faq.question}</h4>
            <i className={`icon fa-solid ${activeIndex === i ? 'fa-caret-up active' : 'fa-caret-down'}`}></i>
          </div>
          <div className={`answer ${activeIndex === i ? 'active' : ''}`}><p>{faq.answer}</p></div>
        </div>
      ))}
    </div>
  );
};

export default FAQ;
