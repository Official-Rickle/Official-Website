import { Grid, Typography, Paper } from "@mui/material";
import React from "react";
import RickleFooter from "../rickle/RickleFooter";
import RickleForPeople from "./RickleForPeople";

export default function RickleTermsOfServicePage() {
  return (
    <React.Fragment>
      <RickleForPeople />
      <Grid container>
      
        <Paper
          elevation={0}
          sx={{ m: 5, px: 2.2, border: "7px solid #C121A4", width:"90%" }}
        >
          <Grid
            item
            container
            gap={2}
            alignItems="left"
            justifyContent="left"
            align="left"
            overflow={"hidden"}
          >
            <Grid item xs={12}>
              <Typography variant="h3" color="red">
                Terms &amp; Conditions
              </Typography>
              <Typography variant="h5" color="red">Last updated: January 1st, 2023</Typography>
            </Grid>
            <Grid item xs={10}>

              <Typography variant="body1">
                Welcome to the RICKLE website. This site has been created for your entertainment, educational and personal use.
              </Typography>

              <Typography variant="body1" textAlign={"justify"}>
                PLEASE READ SECTIONS 17 AND 18 BELOW CAREFULLY AS THEY CONTAIN A BINDING ARBITRATION AGREEMENT AND A CLASS ACTION WAIVER, WHICH MAY AFFECT YOUR LEGAL RIGHTS.
              </Typography>

              <Typography variant="h5">1. AGREEMENT TO TERMS</Typography>
              <Typography variant="body1">
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and M.A.D. Computer Consulting, LLC (“we,” “us” or “our”), concerning your access to and use of the rickletoken.com website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).
              </Typography>
              <Typography variant="body1">
                You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Site and you must discontinue use immediately.
              </Typography>
              <Typography variant="body1">
                Supplemental Terms of Service or documents that may be posted on the Site from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Service at any time and for any reason.
              </Typography>
              <Typography variant="body1">
                We will alert you about any changes by updating the “Last updated” date of these Terms of Service, and you waive any right to receive specific notice of each such change.
              </Typography>
              <Typography variant="body1">
                It is your responsibility to periodically review these Terms of Service to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Terms of Service by your continued use of the Site after the date such revised Terms of Service are posted.
              </Typography>
              <Typography variant="body1">
                The information provided on the Site is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country.
              </Typography>
              <Typography variant="body1">
                Accordingly, those persons who choose to access the Site from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.
              </Typography>
              <Typography variant="body1">
                The Site is intended for users who are at least 13 years of age. All users who are minors in the jurisdiction in which they reside (generally under the age of 18) must have the permission of, and be directly supervised by, their parent or guardian to use the Site. If you are a minor, you must have your parent or guardian read and agree to these Terms of Service prior to you using the Site.
              </Typography>

              <Typography variant="h5">2. INTELLECTUAL PROPERTY RIGHTS</Typography>
              <Typography variant="body1">
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of the United States, foreign jurisdictions, and international conventions.
              </Typography>
              <Typography variant="body1">
                The Content and the Marks are provided on the Site “AS IS” for your information and personal use only. Except as expressly provided in these Terms of Service, no part of the Site and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
              </Typography>
              <Typography variant="body1">
                Provided that you are eligible to use the Site, you are granted a limited license to access and use the Site and to download or print a copy of any portion of the Content to which you have properly gained access solely for your personal, non-commercial use. We reserve all rights not expressly granted to you in and to the Site, the Content and the Marks.
              </Typography>

              <Typography variant="h5">3. PRIVACY POLICY</Typography>
              <Typography variant="body1">
                We care about data privacy and security. We have developed a Privacy Policy in order to inform you of its practices with respect to the collection, use, disclosure and protection of your information. Please review our Privacy Policy at https://therickle.com/privacypolicy. You can also find it on our Site’s Home Page. By using the Site, you agree to be bound by our Privacy Policy, which is incorporated into these Terms of Service. Please be advised the Site is hosted in the United States.
              </Typography>
              <Typography variant="body1">
                If you access the Site from the European Union, Asia, or any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United States, then through your continued use of the Site, you are transferring your data to the United States, and you expressly consent to have your data transferred to and processed in the United States. Please review our Data Privacy Policy (GDPR) as to data collection and processing for all users, including those outside the United States at https://therickle.com/gdpr.
              </Typography>
              <Typography variant="body1">
                Further, we do not knowingly accept, request, or solicit information from children or knowingly market to children. Therefore, in accordance with the U.S. Children’s Online Privacy Protection Act, if we receive actual knowledge that anyone under the age of 13 has provided personal information to us without the requisite and verifiable parental consent, we will delete that information from the Site as quickly as is reasonably practical.
              </Typography>

              <Typography variant="h5">4. USER REPRESENTATIONS</Typography>
              <Typography variant="body1">
                By using the Site, you represent and warrant that:
                <ol>
                  <li>all registration information you submit will be true, accurate, current, and complete;</li>
                  <li>you will maintain the accuracy of such information and promptly update such registration information as necessary;</li>
                  <li>you have the legal capacity and you agree to comply with these Terms of Service;</li>
                  <li>you are not under the age of 13;</li>
                  <li>not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Site;</li>
                  <li>you will not access the Site through automated or non-human means, whether through a bot, script, or otherwise;</li>
                  <li>you will not use the Site for any illegal or unauthorized purpose;</li>
                  <li>your use of the Site will not violate any applicable law or regulation.</li>
                </ol>             
              </Typography>
              <Typography variant="body1">
                If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Site (or any portion thereof).
              </Typography>
              <Typography variant="h5">5. USER REGISTRATION</Typography>
              <Typography variant="body1">
                You may be required to register with the Site, by providing your name and email address and creating an account. You agree to keep your password confidential, if applicable, and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
              </Typography>
              <Typography variant="h5">6. COMMUNICATION PREFERENCES AND CONSENT.</Typography>
              <Typography variant="body1">
                From time to time we may send you communications to the email address associated with your account or email address that was used to register on this Site. These communications may include, but are not limited to, information, new products and recommendations, special offers, and other account-related or transactional messages. These communications will also include consent request, opt-in and opt-out instructions. Also, when you register on this Site, you may receive SMS or text messages and communications from or related to this Site. If so, you will be provided with the right to consent or opt-in to allow for such messages and communications, if you wish.
              </Typography>
              <Typography variant="h5">7. PROHIBITED ACTIVITIES</Typography>
              <Typography variant="body1">
                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
              </Typography>
              <Typography variant="body1">
                As a user of the Site, you agree not to:
                <ol>
                  <li>
                  systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.
                  </li>
                  <li>make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
                  <li>use a buying agent or purchasing agent to make purchases on the Site.</li>
                  <li>use the Site to advertise or offer to sell goods and services.</li>
                  <li>circumvent, disable, or otherwise interfere with security-related features of the Site, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Site and/or the Content contained therein.</li>
                  <li>engage in unauthorized framing of or linking to the Site.</li>
                  <li>trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords;</li>
                  <li>make improper use of our support services or submit false reports of abuse or misconduct.</li>
                  <li>engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
                  <li>interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.</li>
                  <li>attempt to impersonate another user or person or use the username of another user.</li>
                  <li>sell or otherwise transfer your account.</li>
                  <li>use any information obtained from the Site in order to harass, abuse, or harm another person.</li>
                  <li>use the Site as part of any effort to compete with us or otherwise use the Site and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
                  <li>decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Site.</li>
                  <li>attempt to bypass any measures of the Site designed to prevent or restrict access to the Site, or any portion of the Site.</li>
                  <li>harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Site to you.</li>
                  <li>delete the copyright or other proprietary rights notice from any Content.</li>
                  <li>copy or adapt the Site’s software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
                  <li>upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party’s uninterrupted use and enjoyment of the Site or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Site.</li>
                  <li>upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats (“gifs”), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as “spyware” or “passive collection mechanisms” or “pcms”).</li>
                  <li>except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Site, or using or launching any unauthorized script or other software.</li>
                  <li>disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site.</li>
                  <li>use the Site in a manner inconsistent with any applicable laws or regulations.</li>
                </ol>
              </Typography>
              <Typography variant="h5">8. SUBMISSIONS</Typography>
              <Typography variant="body1">
                You acknowledge and agree that any questions, comments, suggestions, ideas, feedback, or other information regarding the Site (“Submissions”) provided by you to us are non-confidential and shall become our sole property. We shall own exclusive rights, including all intellectual property rights, and shall be entitled to the unrestricted use and dissemination of these Submissions for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.
              </Typography>
              <Typography variant="body1">
                You hereby waive all moral rights to any such Submissions, and you hereby warrant that any such Submissions are original with you or that you have the right to submit such Submissions. You agree there shall be no recourse against us for any alleged or actual infringement or misappropriation of any proprietary right in your Submissions.
              </Typography>
              <Typography variant="h5">9. THIRD-PARTY WEBSITES AND CONTENT</Typography>
              <Typography variant="body1">
                The Site may contain (or you may be sent via the Site) links to other websites (“Third-Party Websites”) as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties (“Third-Party Content”).
              </Typography>
              <Typography variant="body1">
                Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Site or any Third-Party Content posted on, available through, or installed from the Site, including the content, accuracy, offensiveness, opinions, reliability, privacy practices, or other policies of or contained in the Third-Party Websites or the Third-Party Content.
              </Typography>
              <Typography variant="body1">
                Inclusion of, linking to, or permitting the use or installation of any Third-Party Websites or any Third-Party Content does not imply approval or endorsement thereof by us. If you decide to leave the Site and access the Third-Party Websites or to use or install any Third-Party Content, you do so at your own risk, and you should be aware these Terms of Service no longer govern.
              </Typography>
              <Typography variant="body1">
                You should review the applicable terms and policies, including privacy and data gathering practices, of any website to which you navigate from the Site or relating to any applications you use or install from the Site. Any purchases you make through Third-Party Websites will be through other websites and from other companies, and we take no responsibility whatsoever in relation to such purchases which are exclusively between you and the applicable third party.
              </Typography>
              <Typography variant="body1">
                You agree and acknowledge that we do not endorse the products or services offered on Third-Party Websites and you shall hold us harmless from any harm caused by your purchase of such products or services. Additionally, you shall hold us harmless from any losses sustained by you or harm caused to you relating to or resulting in any way from any Third-Party Content or any contact with Third-Party Websites.
              </Typography>
              <Typography variant="h5">10. ADVERTISERS</Typography>
              <Typography variant="body1">
                We may allow advertisers to display their advertisements and other information in certain areas of the Site, such as sidebar advertisements or banner advertisements. If you are an advertiser, you shall take full responsibility for any advertisements you place on the Site and any services provided on the Site or products sold through those advertisements.
              </Typography>
              <Typography variant="body1">
                Further, as an advertiser, you warrant and represent that you possess all rights and authority to place advertisements on the Site, including, but not limited to, intellectual property rights, publicity rights, and contractual rights.
              </Typography>
              <Typography variant="body1">
                As an advertiser, you agree that such advertisements are subject to our Digital Millennium Copyright Act (“DMCA”) Notice and Policy provisions as described below, and you understand and agree there will be no refund or other compensation for DMCA takedown-related issues. We simply provide the space to place such advertisements, and we have no other relationship with advertisers.
              </Typography>
              <Typography variant="h5">11. SITE MONITORING AND RESTRICTIONS</Typography>
              <Typography variant="body1">
                We reserve the right, but not the obligation, to:
                <ol>
                  <li>monitor the Site for violations of these Terms of Service;</li>
                  <li>take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Service, including without limitation, reporting such user to law enforcement authorities;</li>
                  <li>in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) your access or any of your contributions or any portion thereof; or</li>
                  <li>otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site.</li>
                </ol>
              </Typography>
              <Typography variant="h5">12. DIGITAL MILLENNIUM COPYRIGHT ACT (DMCA) NOTICE AND POLICY</Typography>
              <ol>
                <li>
                  <Typography variant="h6">Notifications</Typography>
                  <Typography variant="body2">
                    We respect the intellectual property rights of others. If you believe that any material available on or through the Site infringes upon any copyright you own or control, please immediately notify our Designated Copyright Agent using the contact information provided below (a “Notification”).
                  </Typography>
                  <Typography variant="body2">
                    A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to federal law you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Site infringes your copyright, you should consider first contacting an attorney.
                  </Typography>
                  <Typography variant="body2">
                    All Notifications should meet the requirements of DMCA 17 U.S.C. § 512(c)(3) and include the following information:
                    <ol>
                      <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed;</li>
                      <li>identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works on the Site are covered by the Notification, a representative list of such works on the Site;</li>
                      <li>identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material;</li>
                      <li>information reasonably sufficient to permit us to contact the complaining party, such as an address, telephone number, and, if available, an email address at which the complaining party may be contacted;</li>
                      <li>a statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law;</li>
                      <li>a statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed upon.</li>
                    </ol>
                  </Typography>
                </li>
                <li>
                  <Typography variant="h6">Counter Notification</Typography>
                  <Typography variant="body2">
                    If you believe your own copyrighted material has been removed from the Site as a result of a mistake or misidentification, you may submit a written counter notification to us using the contact information provided below (a “Counter Notification”).
                  </Typography>
                  <Typography variant="body2">
                    To be an effective Counter Notification under the DMCA, your Counter Notification must include substantially the following:
                    <ol>
                      <li>identification of the material that has been removed or disabled and the location at which the material appeared before it was removed or disabled;</li>
                      <li>a statement that you consent to the jurisdiction of the Federal District Court in which your address is located, or if your address is outside the United States, for any judicial district in which we are located;</li>
                      <li>a statement that you will accept service of process from the party that filed the Notification or the party’s agent;</li>
                      <li>your name, address, and telephone number;</li>
                      <li>a statement under penalty of perjury that you have a good faith belief that the material in question was removed or disabled as a result of a mistake or misidentification of the material to be removed or disabled;</li>
                      <li>your physical or electronic signature.</li>
                    </ol>
                  </Typography>
                  <Typography variant="body2">
                    If you send us a valid, written Counter Notification meeting the requirements described above, we will restore your removed or disabled material, unless we first receive notice from the party filing the Notification informing us that such party has filed a court action to restrain you from engaging in infringing activity related to the material in question.
                  </Typography>
                  <Typography variant="body2">
                    Please note that if you materially misrepresent that the disabled or removed content was removed by mistake or misidentification, you may be liable for damages, including costs and attorney’s fees. Filing a false Counter Notification constitutes perjury.
                    <address>
                    Attn: Chief Legal Officer
                    429 1st Street
                    Casa, Arkansas 72025
                    legal@rickletoken.com
                    </address>
                  </Typography>
                </li>
              </ol>
              <Typography variant="h5">13. COPYRIGHT INFRINGEMENTS</Typography>
              <Typography variant="body1">
                We respect the intellectual property rights of others. If you believe that any material available on or through the Site infringes upon any copyright you own or control, please immediately notify us using the contact information provided below (a “Notification”). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification.
              </Typography>
              <Typography variant="body1">
                Please be advised that pursuant to federal law you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Site infringes your copyright, you should consider first contacting an attorney.
              </Typography>
              <Typography variant="h5">14. TERM AND TERMINATION</Typography>
              <Typography variant="body1">
                These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN EMAIL AND/OR IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OF SERVICE OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SITE OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.
              </Typography>
              <Typography variant="body1">
                If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, your email address or the name of any third party, even if you may be acting on behalf of the third party.
              </Typography>
              <Typography variant="body1">
                In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress
              </Typography>
              <Typography variant="h5">15. MODIFICATIONS AND INTERRUPTIONS</Typography>
              <Typography variant="body1">
                We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Site without notice at any time.
              </Typography>
              <Typography variant="body1">
                We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.
              </Typography>
              <Typography variant="body1">
                We cannot guarantee the Site will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Site, resulting in interruptions, delays, or errors.
              </Typography>
              <Typography variant="body1">
                We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Site at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Site during any downtime or discontinuance of the Site.
              </Typography>
              <Typography variant="body1">
                Nothing in these Terms of Service will be construed to obligate us to maintain and support the Site or to supply any corrections, updates, or releases in connection therewith.
              </Typography>
              <Typography variant="h5">16. GOVERNING LAW</Typography>
              <Typography variant="body1">
                These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of the State of Nevada applicable to agreements made and to be entirely performed within the State of Nevada, without regard to its conflict of law principles
              </Typography>
              <Typography variant="h5">17. DISPUTE RESOLUTION</Typography>
              <Typography variant="body1" textAlign={"justify"}>
                ANY DISPUTE, CONTROVERSY OR CLAIM YOU HAVE ARISING OUT OF OR RELATED TO THESE TERMS OF SERVICE, A BREACH THEREOF OR YOUR USE OF THIS SITE SHALL BE EXCLUSIVELY SUBMITTED AND DECIDED BY BINDING ARBITRATION ADMINISTERED BY THE AMERICAN ARBITRATION ASSOCIATION (“AAA”). ANY LEGAL ACTION OF WHATEVER NATURE BROUGHT BY US AGAINST YOU MAY BE COMMENCED OR PROSECUTED IN THE STATE AND FEDERAL COURTS LOCATED IN CLARK COUNTY, NEVADA, AND YOU HEREBY CONSENT TO SAME, AND WAIVE ALL DEFENSES OF LACK OF PERSONAL JURISDICTION AND FORUM NON CONVENIENS WITH RESPECT TO VENUE AND JURISDICTION IN SUCH STATE AND FEDERAL COURTS.
              </Typography>
              <Typography variant="h5">18. WAIVER OF CLASS ACTION</Typography>
              <Typography variant="body1" textAlign={"justify"}>
                NOTWITHSTANDING ANYTHING CONTAINED HEREIN, YOU AGREE TO ABSOLUTELY AND UNCONDITIONALLY WAIVE ANY AND ALL RIGHTS TO PARTICIPATE IN OR TO BE INCLUDED IN ANY CLASS ACTION LAWSUITS OR INCLUSION IN ANY MULTI-PARTY ACTIONS OR SUITS AGAINST US, ANY OF OUR AFFILIATES, SPONSORS, SUBSIDIARIES, VENDORS, EMPLOYEES, AGENTS OR ANY OTHER PERSON OR ENTITY ASSOCIATED THEREWITH.
              </Typography>
              <Typography variant="h5">19. CORRECTIONS</Typography>
              <Typography variant="body1">
                There may be information on the Site that contains typographical errors, inaccuracies, or omissions that may relate to the Site, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Site at any time, without prior notice.
              </Typography>
              <Typography variant="h5">20. DISCLAIMER</Typography>
              <Typography variant="body1" textAlign={"justify"}>
                THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SITE’S CONTENT OR THE CONTENT OF ANY WEBSITES LINKED TO THE SITE AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SITE, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SITE, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SITE BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SITE. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SITE, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.
              </Typography>
              <Typography variant="body1" textAlign={"justify"}>
                AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.
              </Typography>
              <Typography variant="h5">21. LIMITATIONS OF LIABILITY</Typography>
              <Typography variant="body1" textAlign={"justify"}>IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SITE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</Typography>
              <Typography variant="body1" textAlign={"justify"}>NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE LESSER OF THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE ONE MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING OR $0.01. CERTAIN STATE LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES.</Typography>
              <Typography variant="h5">22. INDEMNIFICATION</Typography>
              <Typography variant="body1">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys’ fees and expenses, made by any third party due to or arising out of: (1) use of the Site; (2) breach of these Terms of Service; (3) any breach of your representations and warranties set forth in these Terms of Service; (4) your violation of the rights of a third party, including but not limited to intellectual property rights; or (5) any overt harmful act toward any other user of the Site with whom you connected via the Site.</Typography>
              <Typography variant="body1">Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.</Typography>
              <Typography variant="h5">23. USER DATA</Typography>
              <Typography variant="body1">We will maintain certain data (such as your email address) that you transmit to the Site for the purpose of managing the Site, as well as data relating to your use of the Site. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Site.</Typography>
              <Typography variant="body1">You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.</Typography>
              <Typography variant="h5">24. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</Typography>
              <Typography variant="body1">
                Visiting the Site, registering as a User, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communication be in writing.
              </Typography>
              <Typography variant="body1" textAlign={"justify"}>
                YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SITE.
              </Typography>
              <Typography variant="body1">
                You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means.
              </Typography>
              <Typography variant="h5">25. CALIFORNIA USERS AND RESIDENTS</Typography>
              <Typography variant="body1">
                If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
              </Typography>
              <Typography variant="h5">26. MISCELLANEOUS</Typography>
              <Typography variant="body1">These Terms of Service and any policies or operating rules posted by us on the Site constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Terms of Service shall not operate as a waiver of such right or provision.</Typography>
              <Typography variant="body1">These Terms of Service operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control.</Typography>
              <Typography variant="body1">If any provision or part of a provision of these Terms of Service is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Terms of Service and does not affect the validity and enforceability of any remaining provisions.</Typography>
              <Typography variant="body1">There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Terms of Service or use of the Site. You agree that these Terms of Service will not be construed against us by virtue of having drafted them.</Typography>
              <Typography variant="body1">You hereby waive any and all defenses you may have based on the electronic form of these Terms of Service and the lack of signing by the parties hereto to execute these Terms of Service.</Typography>
              <Typography variant="h5">27. CONTACT US</Typography>
              <Typography variant="body1">In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
                <address>
                  429 1st Street
                  Casa Arkansas 72025
                  support@rickletoken.com
                </address>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <RickleFooter />
    </React.Fragment>
  );
}
