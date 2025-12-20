import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface VerifyEmailProps {
  verificationCode?: string;
}

const baseUrl = process.env.BETTER_AUTH_URL
  ? `https://${process.env.BETTER_AUTH_URL}`
  : "";

export default function VerifyEmail({ verificationCode }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                aws: ["Outfit", "sans-serif"],
              },
            },
          },
        }}
      >
        <Body className="bg-white font-aws text-[#212121]">
          <Preview>Sign In Email Verification</Preview>
          <Container className="p-5 mx-auto bg-[#eee]">
            <Section className="bg-white">
              <Section className="bg-[#252f3d] flex py-5 items-center justify-center">
                <Img
                  src="/ecampus-logo.svg"
                  width="75"
                  height="45"
                  alt="E-CampusHub Logo"
                />
              </Section>
              <Section className="py-[25px] px-[35px]">
                <Heading className="text-[#333] text-[20px] font-bold mb-[15px]">
                  Sign In Code
                </Heading>
                <Text className="text-[#333] text-[14px] leading-6 mt-6 mb-3.5 mx-0">
                  Thanks for signing in with CampusHub. We want to make sure
                  it's really you. Please enter the following verification code
                  when prompted. If you didn&apos;t sign in, you can ignore this
                  message.
                </Text>
                <Section className="flex items-center justify-center">
                  <Text className="text-[#333] m-0 font-bold text-center text-[14px]">
                    Verification code
                  </Text>

                  <Text className="text-[#333] text-[36px] my-2.5 mx-0 font-bold text-center">
                    {verificationCode}
                  </Text>
                  <Text className="text-[#333] text-[14px] m-0 text-center">
                    (This code is valid for 3 minutes)
                  </Text>
                </Section>
              </Section>
              <Hr />
              <Section className="py-[25px] px-[35px]">
                <Text className="text-[#333] text-[14px] m-0">
                  CampusHub will never email you and ask you to disclose or
                  verify your password.
                </Text>
              </Section>
            </Section>
            <Text className="text-[#333] text-[12px] my-6 mx-0 px-5 py-0">
              This message was produced and distributed by CampusHub, All rights
              reserved.{" "}
              <Link
                href="https://e-campushub.com"
                target="_blank"
                className="text-[#2754C5] underline text-[12px]"
              >
                E-CampusHub
              </Link>
              View our{" "}
              <Link
                href="https://e-campushub.com/privacy"
                target="_blank"
                className="text-[#2754C5] underline text-[12px]"
              >
                privacy policy
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

VerifyEmail.PreviewProps = {
  verificationCode: "596853",
} satisfies VerifyEmailProps;
