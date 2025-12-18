import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact E-CampusHub",
  description: "Contact E-CampusHub for any inquiries",
};

export default function Contact() {
  return <ContactClient />;
}
