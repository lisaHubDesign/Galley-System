import React, { useState } from 'react';
import { ArticleState, Section, Figure, Table } from './types';
import { generateId } from './utils/parser';
import { downloadWordDoc } from './utils/wordExport';
import TableEditor from './components/TableEditor';
import FigureEditor from './components/FigureEditor';
import AiAssistant from './components/AiAssistant';
import DocumentImporter from './components/DocumentImporter';
import PaperPreview from './components/PaperPreview';
import {
  FileText,
  Settings,
  Image,
  Table as TableIcon,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Download,
  RotateCcw,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Info
} from 'lucide-react';

// Static Academic ACSR Proceedings Example
const ACSR_EXAMPLE: ArticleState = {
  journalName: 'Advances in Computer Science Research (ACSR)',
  volume: '73',
  conferenceLine: '7th International Conference on Education, Management, Information and Computer Science (ICEMC 2017)',
  publisher: 'Atlantis Press',
  copyrightYear: '2017',
  startPageNumber: '1222',
  licenseLine: 'This is an open access article under the CC BY-NC license (http://creativecommons.org/licenses/by-nc/4.0/).',
  title: 'Design and Implementation of Digital Library',
  authors: 'Fanqi Wei, Yan Zhang and Xiaoping Feng',
  affiliation: 'Jiangxi Technical College of Manufacturing, Nanchang, 330095',
  keywords: 'Web; mobile; digital library; Android',
  abstract: 'With the continuous development of computer technology and wireless Internet, the number of mobile phone users is growing at an unprecedented rate. As the content of traditional culture, libraries have also undergone tremendous changes nowadays. In the wireless network technology, database technology and software engineering technology, the research of digital library innovation, in this context, as design research and development of mobile digital library. The digital library based on mobile Web is a further innovation of digital library service. It consists of mobile terminals (including mobile phones, tablet PCs, etc.), wireless networks (including 4G and Wi-Fi, etc.) and digital library application system composed of three basic elements. People are not limited by time and space. They can easily access library system at any time and place by means of various devices on the palm, and carry out the functions of browsing and pre-borrowing of books and other information.',
  sections: [
    {
      id: 'sec-1',
      heading: 'Introduction',
      paragraphs: [
        'At present, computer technology continues to develop, wireless network speed continues to rise. The way people communicate has changed dramatically, and mobile communications and mobile 4G networks are more essential means of communication. In the 4G network, the speed of mobile network has been greatly improved. At the same time, high-speed wireless network has also brought many mobile network information services. The library provides abundant resources for readers, and in the development of computer technology, digital library also provides books and information services for readers in an information mode. With the rapid development of mobile network technology, the application of digital library is changing quietly. The digital library system based on mobile network has integrated modern computer science and technology, wireless network technology and database management system technology, and has been developing continuously. The digital library system of mobile network, to provide users with a more extensive mass of library information and resources, so that readers can access various books information whenever and wherever possible to greatly improve the traditional library, service capacity, service quality and service level. The purpose of this paper is to realize the digital library system based on mobile Web. On the basis of the existing Web network platform construction, using mobile Internet technology, Web program development technology, database system development technology, etc. Combined with the current popular tools such as ASP.NET, JQuery, Mobile and so on, it provides an effective solution for the implementation of mobile Web based digital library system.'
      ],
      figures: [],
      tables: []
    },
    {
      id: 'sec-2',
      heading: 'Introduction to Mobile Web',
      paragraphs: [
        'The system architecture of Web applications is commonly referred to as the browser server architecture (B / S architecture). In this architecture, users use the Web browser as the client to access the server-side Web site, which downloads the data of the web site and caches the data on the client. The browser displays the page of the web site and the user operates in the browser. Compared to the client architecture of the C/S system architecture, the Web application has several advantages over the B/S system architecture:',
        '(1) Independent of client platform. The Web application runs in the browser. Therefore, users regardless of what the machine, what kind of what kind of hardware configuration and operating system, as long as the user support standard Web browser and client will connect to the Internet, you can run the Web application and the access to the site.',
        '(2) The system is easy to maintain. We have deployed web applications on remote servers and only need to change the application on the server side when the application is re - released or updated. Local clients do not need any changes. The client browser simply accesses the web site to access the latest version of the Web application on the server side.',
        '(3) User data is easy to manage. In the B/S architecture, user data is stored on the remote server side and can be operated directly on the server side to manage user data. On a single client, the system does not need to do administrative actions.'
      ],
      figures: [],
      tables: []
    },
    {
      id: 'sec-3',
      heading: 'System Architecture Design',
      paragraphs: [
        'For clients, you can access the system Web site only through the browser. However, as the current mobile platform system varies and the browser kernel is different, the same web site has different effects on different browsers. Based on mobile Web digital library system, we will develop thin client based on Web Kit, load server web site, and further realize the cross platform operation of the system. And the software application is deployed on the server side, which can realize the separation between the front and the back, greatly reducing the coupling between the server and the client. System server developers and managers can focus on the development and maintenance of the server, while strengthening the security of the system program; The client developers and managers of the system focus on developing thin clients on different platforms to parse the same web page to display the same interface.',
        'The architecture of Digital Library Based on mobile Web can be divided into three parts, data processing layer, service presentation layer and thin client layer. The system architecture is shown in fig. 1:'
      ],
      figures: [
        {
          id: 'fig-1',
          caption: 'Figure 1.  System Three-Layer Diagram',
          imageDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="100%"><rect width="100%" height="100%" fill="%23ffffff" /><rect x="150" y="20" width="200" height="40" fill="none" stroke="%23000000" stroke-width="1.5" /><line x1="250" y1="20" x2="250" y2="60" stroke="%23000000" stroke-width="1.5" /><text x="200" y="45" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle" font-weight="bold">Browser</text><text x="300" y="45" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle" font-weight="bold">WebKit client end</text><text x="110" y="45" font-family="\'Times New Roman\', serif" font-size="12" font-weight="bold" text-anchor="end">Slim client layer</text><line x1="20" y1="80" x2="480" y2="80" stroke="%23000000" stroke-width="1" stroke-dasharray="4 4" /><line x1="250" y1="85" x2="250" y2="125" stroke="%23000000" stroke-width="1.5" /><polygon points="250,85 246,93 254,93" fill="%23000000" /><polygon points="250,125 246,117 254,117" fill="%23000000" /><rect x="200" y="140" width="100" height="25" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="157" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">Web page</text><rect x="200" y="175" width="100" height="25" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="192" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">ASP.NET</text><rect x="200" y="210" width="100" height="25" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="227" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">III server</text><text x="180" y="192" font-family="\'Times New Roman\', serif" font-size="12" font-weight="bold" text-anchor="end">Service layer</text><line x1="20" y1="255" x2="480" y2="255" stroke="%23000000" stroke-width="1" stroke-dasharray="4 4" /><line x1="250" y1="260" x2="250" y2="300" stroke="%23000000" stroke-width="1.5" /><polygon points="250,260 246,268 254,268" fill="%23000000" /><polygon points="250,300 246,292 254,292" fill="%23000000" /><rect x="175" y="310" width="150" height="30" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="329" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle" font-weight="bold">SQL Server database</text><text x="160" y="329" font-family="\'Times New Roman\', serif" font-size="12" font-weight="bold" text-anchor="end">Database layer</text></svg>',
          widthPercent: 75
        }
      ],
      tables: []
    },
    {
      id: 'sec-4',
      heading: 'System Database Design',
      paragraphs: [
        'The database system of software is used to store data records in the system, and it has the characteristics of simple operation, convenient and quick. Common data models include hierarchical model, mesh model and relational model. In recent years, the majority of database system researchers focus on relational model databases. The E-R (entity relation) method is the most widely used method of modeling relational models.',
        'The digital library system based on mobile Web has designed the E-R diagram of the key functional part of the system according to the needs of user information storage and processing. As shown in fig. 2:',
        'The overall task of digital library system development is to realize the borrowing and management of books. The system has readers oriented books and personal information query interface, and also has an administrator oriented library management interface. Readers\' main concerns are as follows:',
        '(1) The system provides the method of inquiry books, how to use the current books to borrow is expired;',
        '(2) They are borrowing or borrowing books and other information.'
      ],
      figures: [
        {
          id: 'fig-2',
          caption: 'Figure 2.  System E-R Diagram',
          imageDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="100%"><rect width="100%" height="100%" fill="%23ffffff" /><line x1="120" y1="120" x2="40" y2="70" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="90" y2="50" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="160" y2="40" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="210" y2="60" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="40" y2="130" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="50" y2="180" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="90" y2="210" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><line x1="120" y1="120" x2="160" y2="210" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><rect x="120" y="105" width="80" height="30" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="160" y="124" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle" font-weight="bold">Book</text><ellipse cx="40" cy="70" rx="30" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="40" y="74" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">author</text><ellipse cx="90" cy="50" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="90" y="54" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">type</text><ellipse cx="160" cy="40" rx="30" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="160" y="44" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">Book\'s ID</text><ellipse cx="220" cy="60" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="220" y="64" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">press</text><ellipse cx="40" cy="130" rx="35" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="40" y="134" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">Book name</text><ellipse cx="50" cy="180" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="50" y="184" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">Year</text><ellipse cx="95" cy="215" rx="30" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="95" y="219" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">keyword</text><ellipse cx="165" cy="215" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="165" y="219" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">status</text><line x1="200" y1="120" x2="250" y2="120" stroke="%23000000" stroke-width="1.5" /><text x="210" y="115" font-family="\'Times New Roman\', serif" font-size="11">n</text><polygon points="250,120 280,105 310,120 280,135" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="280" y="124" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">Management</text><line x1="310" y1="120" x2="360" y2="120" stroke="%23000000" stroke-width="1.5" /><text x="350" y="115" font-family="\'Times New Roman\', serif" font-size="11">m</text><rect x="360" y="105" width="90" height="30" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="405" y="124" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle" font-weight="bold">administrator</text><line x1="405" y1="105" x2="405" y2="70" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><ellipse cx="405" cy="58" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="405" y="62" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">ID</text><line x1="405" y1="135" x2="455" y2="160" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><ellipse cx="465" cy="165" rx="30" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="465" y="169" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">password</text><line x1="160" y1="135" x2="160" y2="245" stroke="%23000000" stroke-width="1.5" /><text x="150" y="150" font-family="\'Times New Roman\', serif" font-size="11">n</text><polygon points="160,245 210,230 260,245 210,260" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="210" y="244" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">borrowing &amp; lending</text><line x1="260" y1="245" x2="310" y2="245" stroke="%23000000" stroke-width="1.5" /><text x="300" y="240" font-family="\'Times New Roman\', serif" font-size="11">m</text><rect x="310" y="230" width="80" height="30" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="350" y="249" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle" font-weight="bold">reader</text><line x1="350" y1="260" x2="270" y2="295" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><ellipse cx="260" cy="300" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="260" y="304" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">email</text><line x1="350" y1="260" x2="320" y2="310" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><ellipse cx="315" cy="315" rx="25" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="315" y="319" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">name</text><line x1="350" y1="260" x2="380" y2="310" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><ellipse cx="385" cy="315" rx="30" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="385" y="319" font-family="\'Times New Roman\', serif" font-size="9" text-anchor="middle">username</text><line x1="350" y1="260" x2="430" y2="290" stroke="%23000000" stroke-width="1" stroke-dasharray="2 2" /><ellipse cx="440" cy="295" rx="35" ry="12" fill="none" stroke="%23000000" stroke-width="1" /><text x="440" y="299" font-family="\'Times New Roman\', serif" font-size="9" text-anchor="middle">academic degree</text></svg>',
          widthPercent: 85
        }
      ],
      tables: []
    },
    {
      id: 'sec-5',
      heading: 'Design of Key Module Functions',
      paragraphs: [
        'The function of the book inquiry module is provided to all users. For readers, users can use the browser to access the library system site through the mobile terminal and inquire about the book information in the library; Readers can borrow the books they find in the library. For the administrator user, access to the digital library site through the browser, can the book information query, to find the books, the administrator can edit, modify, delete and other information options. The program flow chart of the book inquiry module is shown in figure 3:',
        'This part of function module mainly faces the backstage management personnel, the realization function is the warehousing, the new purchase book and the clean waste book. When a new book enters the library, the librarian adds books and information to the system and specifies the location of the book, and writes the relevant information to the database. After the addition, the reader can inquire and borrow the book. When cleaning up the waste books, the administrator finds and deletes the book in the system and updates it to the database as well. At this point, the reader will not be able to access the book. The program flow chart of the library information management module is shown in fig. 4:'
      ],
      figures: [
        {
          id: 'fig-3',
          caption: 'Figure 3.  Library query module program flow chart',
          imageDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" width="100%"><rect width="100%" height="100%" fill="%23ffffff" /><rect x="200" y="10" width="100" height="30" rx="15" ry="15" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="29" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle">Start</text><line x1="250" y1="40" x2="250" y2="70" stroke="%23000000" stroke-width="1.5" /><polygon points="250,70 246,62 254,62" fill="%23000000" /><polygon points="250,75 320,95 250,115 180,95" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="99" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">Input Query?</text><line x1="250" y1="115" x2="250" y2="145" stroke="%23000000" stroke-width="1.5" /><polygon points="250,145 246,137 254,137" fill="%23000000" /><rect x="170" y="145" width="160" height="40" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="169" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">Query SQL Database</text><line x1="250" y1="185" x2="250" y2="215" stroke="%23000000" stroke-width="1.5" /><polygon points="250,215 246,207 254,207" fill="%23000000" /><rect x="200" y="215" width="100" height="30" rx="15" ry="15" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="234" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle">Display &amp; End</text></svg>',
          widthPercent: 65
        },
        {
          id: 'fig-4',
          caption: 'Figure 4.  Library information management module',
          imageDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" width="100%"><rect width="100%" height="100%" fill="%23ffffff" /><rect x="200" y="10" width="100" height="30" rx="15" ry="15" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="29" font-family="\'Times New Roman\', serif" font-size="12" text-anchor="middle">Start</text><line x1="250" y1="40" x2="250" y2="70" stroke="%23000000" stroke-width="1.5" /><polygon points="250,70 246,62 254,62" fill="%23000000" /><rect x="170" y="70" width="160" height="35" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="92" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">Librarian Authenticated</text><line x1="250" y1="105" x2="250" y2="135" stroke="%23000000" stroke-width="1.5" /><polygon points="250,135 246,127 254,127" fill="%23000000" /><polygon points="250,135 330,155 250,175 170,155" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="159" font-family="\'Times New Roman\', serif" font-size="10" text-anchor="middle">Add/Delete Book?</text><line x1="250" y1="175" x2="250" y2="205" stroke="%23000000" stroke-width="1.5" /><polygon points="250,205 246,197 254,197" fill="%23000000" /><rect x="200" y="205" width="100" height="35" rx="15" ry="15" fill="none" stroke="%23000000" stroke-width="1.5" /><text x="250" y="226" font-family="\'Times New Roman\', serif" font-size="11" text-anchor="middle">Update Database</text></svg>',
          widthPercent: 65
        }
      ],
      tables: []
    },
    {
      id: 'sec-6',
      heading: 'Conclusion',
      paragraphs: [
        'This paper starts with the analysis of the development of mobile digital library and the application of mobile Web technology. Based on the study and research of ASP.NET technology, IIS server, Android platform and related technologies, the mobile digital library system is designed and implemented by using the mobile Web development technology. The main work and achievements of this thesis are as follows:',
        '(1) The application of mobile Web technology in digital library information system is deeply analyzed and studied.',
        '(2) The system feasibility analysis, system requirement analysis, system architecture design, system database design and system detailed design of the digital library system based on mobile Web are carried out. On this basis, the mobile digital library has been developed.',
        '(3) After the completion of each functional module, the system function modules are displayed.'
      ],
      figures: [],
      tables: []
    }
  ],
  referencesText: `[1]. Pan M L, Xiong Y M. Discussion on Cultivating Professional Skills of Computer Application Talents in Higher Vocational Education[J]. Computer Knowledge & Technology, 2016.
[2]. Xu Y, Zhenjiang. The Computer Application in the Personnel Management of Government Institutions[J]. Wireless Internet Technology, 2016.
[3]. Fraqueiro F R, Albuquerque P F, Gamboa P V. A computer application for parametric aircraftdesign[J]. Open Engineering, 2016, 6(1):432-440.
[4]. Dong Y. Practice and Exploration of the Inquiry Based Teaching Method in the Basic Course of Computer Application in Medical College[J]. China Continuing Medical Education, 2016.
[5]. Ping-Xia H U. The Micro Class Design and Production Practice of "Computer Application Foundation"[J]. Computer Knowledge & Technology, 2016.
[6]. Zhao Y, Hao L, Jilong L U. Focus on the Process and Ability of Non Computer Professional Computer Application Teaching Reform[J]. Guide of Science & Education, 2016.
[7]. Victor S R. Critical Analysis of Computer Application at Secondary Schools[J]. 2016.
[8]. Qi Y. Exploration curriculum based micro Computer Application Foundation Teaching Reform[J]. Computer Knowledge & Technology, 2016.
[9]. Goutam G. Computer application maturity illustration system with single point of failure analytics and remediation techniques[J]. Journal of Convergence Information Technology, 2016, 6(3):132-145.
[10]. Lebeau M J, Phukan P. Computer application data in search results[J]. 2017.
[11]. Hackborn D K, Bort D P, Onorato J M, et al. Computer application pre-permissioning[J]. 2017.
[12]. Guo Y T, Huang X, Chen M, et al. Research Progress on Computer Application in Chemical Industry[J]. Guangzhou Chemical Industry, 2016.`
};

export default function App() {
  const [article, setArticle] = useState<ArticleState>(ACSR_EXAMPLE);
  const [activeTab, setActiveTab] = useState<'import' | 'basic' | 'sections' | 'figures' | 'tables' | 'ai'>('basic');

  // Load standard example
  const handleLoadExample = () => {
    setArticle(JSON.parse(JSON.stringify(ACSR_EXAMPLE)));
  };

  // Clear current document
  const handleClearAll = () => {
    setArticle({
      journalName: 'Advances in Computer Science Research (ACSR)',
      volume: '',
      conferenceLine: '',
      publisher: 'Atlantis Press',
      copyrightYear: String(new Date().getFullYear()),
      startPageNumber: '',
      licenseLine: 'This is an open access article under the CC BY-NC license (http://creativecommons.org/licenses/by-nc/4.0/).',
      title: '',
      authors: '',
      affiliation: '',
      keywords: '',
      abstract: '',
      sections: [{ id: generateId(), heading: '1. INTRODUCTION', paragraphs: [], figures: [], tables: [] }],
      referencesText: ''
    });
  };

  // Handle document import completions
  const handleImportComplete = (imported: Partial<ArticleState>) => {
    setArticle((prev) => ({
      ...prev,
      ...imported,
      sections: imported.sections || prev.sections
    }));
    setActiveTab('basic');
  };

  // Section editing functions
  const handleAddSection = () => {
    const nextSec: Section = {
      id: generateId(),
      heading: `${article.sections.length + 1}. NEW SECTION`,
      paragraphs: [],
      figures: [],
      tables: []
    };
    setArticle({ ...article, sections: [...article.sections, nextSec] });
  };

  const handleUpdateSection = (id: string, updated: Partial<Section>) => {
    const nextSecs = article.sections.map((s) => (s.id === id ? { ...s, ...updated } : s));
    setArticle({ ...article, sections: nextSecs });
  };

  const handleRemoveSection = (id: string) => {
    setArticle({ ...article, sections: article.sections.filter((s) => s.id !== id) });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= article.sections.length) return;

    const nextSecs = [...article.sections];
    const temp = nextSecs[index];
    nextSecs[index] = nextSecs[nextIndex];
    nextSecs[nextIndex] = temp;

    setArticle({ ...article, sections: nextSecs });
  };

  // AI assistant handlers
  const handleApplyAiAbstract = (abstract: string, keywords: string) => {
    setArticle({ ...article, abstract, keywords });
    setActiveTab('basic');
  };

  const handleApplyAiReferences = (referencesText: string) => {
    setArticle({ ...article, referencesText });
    setActiveTab('basic');
  };

  // Word doc export
  const handleExportWord = () => {
    downloadWordDoc(article);
  };

  // Gather all figures and tables globally from sections for general managers, or assign to sections
  const getAllFigures = (): Figure[] => {
    return article.sections.flatMap((s) => s.figures);
  };

  const handleFiguresChange = (newFigs: Figure[]) => {
    // We map back. For simplicity, we keep figures inside their original sections if possible,
    // or keep them inside the first section as fallback.
    const sectionsCopy = [...article.sections];
    
    // Clear figures from copy first
    sectionsCopy.forEach(s => { s.figures = []; });

    newFigs.forEach((fig, index) => {
      // Put in first section by default or preserve association if index matches
      const targetSecIdx = Math.min(index, sectionsCopy.length - 1);
      if (targetSecIdx >= 0) {
        sectionsCopy[targetSecIdx].figures.push(fig);
      }
    });

    setArticle({ ...article, sections: sectionsCopy });
  };

  const getAllTables = (): Table[] => {
    return article.sections.flatMap((s) => s.tables);
  };

  const handleTablesChange = (newTbls: Table[]) => {
    const sectionsCopy = [...article.sections];
    
    // Clear tables from copy first
    sectionsCopy.forEach(s => { s.tables = []; });

    newTbls.forEach((tbl, index) => {
      const targetSecIdx = Math.min(index, sectionsCopy.length - 1);
      if (targetSecIdx >= 0) {
        sectionsCopy[targetSecIdx].tables.push(tbl);
      }
    });

    setArticle({ ...article, sections: sectionsCopy });
  };

  return (
    <div className="min-h-screen bg-chrome text-paper flex flex-col font-sans">
      {/* Top Utility Header */}
      <header className="topbar flex items-center justify-between px-6 py-4 border-b border-line/60 no-print">
        <div className="flex items-center gap-3">
          <span className="bg-proof-red text-white text-[11px] font-mono tracking-wider px-2 py-0.5 rounded border border-proof-red-dim font-bold">
            GALLEY
          </span>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-tight text-white flex items-center gap-2">
              Galley System
            </h1>
            <p className="text-xs text-muted">Atlantis Press &amp; ACSR Proof-Ready Typesetter</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLoadExample}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-chrome-panel hover:bg-chrome/80 border border-line rounded text-xs text-paper transition font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted" /> Load Example
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-chrome-panel hover:bg-chrome/80 border border-line rounded text-xs text-paper transition font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-proof-red hover:bg-red-800 text-white font-semibold text-xs rounded transition duration-150 shadow"
          >
            <Download className="h-3.5 w-3.5" /> Word Export (.doc)
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left pane: Control Center */}
        <div className="lg:col-span-5 border-r border-line/60 flex flex-col h-[calc(100vh-69px)] overflow-y-auto no-print bg-[#1a1917]/95">
          {/* Main Navigation Tabs */}
          <div className="flex border-b border-line/60 bg-chrome p-1 shrink-0 sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 text-xs font-medium rounded transition flex flex-col items-center gap-1 ${
                activeTab === 'import' ? 'bg-chrome-panel/90 text-proof-red border border-line/30 font-semibold' : 'text-muted hover:text-paper'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Ingest
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-2 text-xs font-medium rounded transition flex flex-col items-center gap-1 ${
                activeTab === 'basic' ? 'bg-chrome-panel/90 text-proof-red border border-line/30 font-semibold' : 'text-muted hover:text-paper'
              }`}
            >
              <Settings className="h-3.5 w-3.5" /> Metadata
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-2 text-xs font-medium rounded transition flex flex-col items-center gap-1 ${
                activeTab === 'sections' ? 'bg-chrome-panel/90 text-proof-red border border-line/30 font-semibold' : 'text-muted hover:text-paper'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Sections
            </button>
            <button
              onClick={() => setActiveTab('figures')}
              className={`flex-1 py-2 text-xs font-medium rounded transition flex flex-col items-center gap-1 ${
                activeTab === 'figures' ? 'bg-chrome-panel/90 text-proof-red border border-line/30 font-semibold' : 'text-muted hover:text-paper'
              }`}
            >
              <Image className="h-3.5 w-3.5" /> Figures
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex-1 py-2 text-xs font-medium rounded transition flex flex-col items-center gap-1 ${
                activeTab === 'tables' ? 'bg-chrome-panel/90 text-proof-red border border-line/30 font-semibold' : 'text-muted hover:text-paper'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Tables
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs font-medium rounded transition flex flex-col items-center gap-1 relative ${
                activeTab === 'ai' ? 'bg-chrome-panel/90 text-amber-500 border border-line/30 font-semibold' : 'text-muted hover:text-paper'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Writer
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping"></span>
            </button>
          </div>

          {/* Form Content Pane */}
          <div className="p-5 space-y-6 flex-1">
            {/* TAB: INGEST */}
            {activeTab === 'import' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-white mb-1.5">Import draft manuscript</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Upload a raw Microsoft Word file or PDF text. The system automatically reads and structured parses figures, tables, reference lists, headings, and details.
                  </p>
                </div>
                <DocumentImporter onImportComplete={handleImportComplete} />
              </div>
            )}

            {/* TAB: BASIC METADATA */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="border-b border-line/50 pb-2">
                  <h3 className="text-xs font-mono uppercase text-proof-red tracking-wider font-semibold">
                    Journal &amp; Conference Series
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Journal/Series Name</label>
                    <input
                      type="text"
                      value={article.journalName}
                      onChange={(e) => setArticle({ ...article, journalName: e.target.value })}
                      className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Volume Number</label>
                    <input
                      type="text"
                      value={article.volume}
                      onChange={(e) => setArticle({ ...article, volume: e.target.value })}
                      className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                      placeholder="e.g. 104"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Conference Venues / Header Line</label>
                  <input
                    type="text"
                    value={article.conferenceLine}
                    onChange={(e) => setArticle({ ...article, conferenceLine: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                    placeholder="e.g. 9th International Conference on Artificial Intelligence..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Publisher Name</label>
                    <input
                      type="text"
                      value={article.publisher}
                      onChange={(e) => setArticle({ ...article, publisher: e.target.value })}
                      className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Copyright Year</label>
                    <input
                      type="text"
                      value={article.copyrightYear}
                      onChange={(e) => setArticle({ ...article, copyrightYear: e.target.value })}
                      className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">Start Page Number</label>
                    <input
                      type="text"
                      value={article.startPageNumber || ''}
                      onChange={(e) => setArticle({ ...article, startPageNumber: e.target.value })}
                      className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                      placeholder="e.g. 1222"
                    />
                  </div>
                </div>

                <div className="border-b border-line/50 pb-2 pt-2">
                  <h3 className="text-xs font-mono uppercase text-proof-red tracking-wider font-semibold">
                    Manuscript Identity
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Article Title</label>
                  <textarea
                    value={article.title}
                    onChange={(e) => setArticle({ ...article, title: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded p-2 text-xs text-paper focus:outline-none"
                    rows={2}
                    placeholder="Real-time Machine Learning Framework..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Authors (comma separated)</label>
                  <input
                    type="text"
                    value={article.authors}
                    onChange={(e) => setArticle({ ...article, authors: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                    placeholder="Emily Vance, Sarah Jenkins, and Alex Rivera"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Institutional Affiliations</label>
                  <textarea
                    value={article.affiliation}
                    onChange={(e) => setArticle({ ...article, affiliation: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded p-2 text-xs text-paper focus:outline-none"
                    rows={2}
                    placeholder="Department of Computer Science, Institute of Advanced Technology..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Keywords (semicolon-separated)</label>
                  <input
                    type="text"
                    value={article.keywords}
                    onChange={(e) => setArticle({ ...article, keywords: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded px-3 py-2 text-xs text-paper focus:outline-none"
                    placeholder="Edge Computing; Deep Learning; Model Quantization"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Abstract Section</label>
                  <textarea
                    value={article.abstract}
                    onChange={(e) => setArticle({ ...article, abstract: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded p-2.5 text-xs text-paper focus:outline-none leading-relaxed text-justify"
                    rows={5}
                    placeholder="The proliferation of IoT devices has led to..."
                  />
                </div>
              </div>
            )}

            {/* TAB: SECTIONS */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-proof-red" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-proof-red font-semibold">
                      Sections Manager
                    </h3>
                  </div>
                  <button
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-proof-red hover:bg-red-800 text-white rounded font-semibold transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Section
                  </button>
                </div>

                {article.sections.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-line rounded bg-chrome/40 text-muted">
                    <p className="text-xs">No sections are defined. Click "Add Section" to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {article.sections.map((sec, index) => (
                      <div
                        key={sec.id}
                        className="bg-chrome-panel border border-line/80 rounded p-3.5 space-y-3.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-semibold text-muted uppercase">
                            Section {index + 1}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveSection(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-chrome border border-line/40 rounded text-muted hover:text-paper disabled:opacity-30 disabled:pointer-events-none"
                              title="Move section up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveSection(index, 'down')}
                              disabled={index === article.sections.length - 1}
                              className="p-1 hover:bg-chrome border border-line/40 rounded text-muted hover:text-paper disabled:opacity-30 disabled:pointer-events-none"
                              title="Move section down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveSection(sec.id)}
                              className="p-1 hover:bg-red-950/40 border border-line/40 hover:border-red-800/60 rounded text-muted hover:text-proof-red"
                              title="Delete section"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-muted mb-1 uppercase tracking-wider">
                            Heading / Title
                          </label>
                          <input
                            type="text"
                            value={sec.heading}
                            onChange={(e) => handleUpdateSection(sec.id, { heading: e.target.value })}
                            className="w-full bg-chrome border border-line/80 focus:border-proof-red rounded px-2.5 py-1.5 text-xs text-paper focus:outline-none font-semibold uppercase"
                            placeholder="e.g. 1. INTRODUCTION"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider">
                              Body Text Paragraphs
                            </label>
                            <span className="text-[9px] text-muted font-mono italic">
                              Press double enter for a new paragraph
                            </span>
                          </div>
                          <textarea
                            value={sec.paragraphs.join('\n\n')}
                            onChange={(e) => {
                              const split = e.target.value.split(/\n\s*\n/).map((p) => p.trim());
                              handleUpdateSection(sec.id, { paragraphs: split });
                            }}
                            className="w-full bg-chrome border border-line/80 focus:border-proof-red rounded p-2 text-xs text-paper focus:outline-none leading-relaxed text-justify"
                            rows={5}
                            placeholder="Write the section narrative content. Double enter automatically generates consecutive, beautifully indented paragraph segments."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* References Block inside Sections tab for easy central access */}
                <div className="pt-4 border-t border-line/50">
                  <div className="flex items-center gap-1.5 border-b border-line/40 pb-2 mb-2.5">
                    <BookOpen className="h-3.5 w-3.5 text-proof-red" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-proof-red font-semibold">
                      Bibliographic References
                    </h3>
                  </div>
                  <textarea
                    value={article.referencesText}
                    onChange={(e) => setArticle({ ...article, referencesText: e.target.value })}
                    className="w-full bg-chrome border border-line focus:border-proof-red rounded p-2.5 text-xs text-paper focus:outline-none font-mono"
                    rows={4}
                    placeholder="[1] Vance E. Article Name. Journal. 2024.&#13;[2] Jenkins S. Quantization. 2025."
                  />
                  <p className="text-[10px] text-muted mt-1.5 leading-normal">
                    Insert one citation per line. The typesetter renders aligned, hanging academic indexes matching citation indexes automatically.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: FIGURES */}
            {activeTab === 'figures' && (
              <FigureEditor figures={getAllFigures()} onChange={handleFiguresChange} />
            )}

            {/* TAB: TABLES */}
            {activeTab === 'tables' && (
              <TableEditor tables={getAllTables()} onChange={handleTablesChange} />
            )}

            {/* TAB: AI ASSISTANT */}
            {activeTab === 'ai' && (
              <AiAssistant
                articleState={article}
                onApplyAbstract={handleApplyAiAbstract}
                onApplyReferences={handleApplyAiReferences}
                onApplyToneParagraph={(orig, polished) => {
                  // Find and replace the paragraph text globally in any section matches
                  const sectionsCopy = article.sections.map((sec) => {
                    const nextParas = sec.paragraphs.map((p) => (p === orig ? polished : p));
                    return { ...sec, paragraphs: nextParas };
                  });
                  setArticle({ ...article, sections: sectionsCopy });
                  setActiveTab('sections');
                }}
              />
            )}
          </div>
        </div>

        {/* Right pane: Academic Galley Sheet Preview */}
        <div className="lg:col-span-7 bg-[#232220] p-6 overflow-y-auto h-[calc(100vh-69px)] flex justify-center">
          <PaperPreview article={article} />
        </div>
      </main>
    </div>
  );
}
