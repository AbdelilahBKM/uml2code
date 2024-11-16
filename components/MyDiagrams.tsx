import { useEffect, useState } from 'react'
import { Project } from '@/types/UMLClass.Type'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle } from 'lucide-react'
import DiagramCard from '@/components/ui/DiagramCard'
import { RootState } from '@/store/redux'
import { useDispatch, useSelector } from 'react-redux'
import { loadAuthState, logout } from '@/store/authReducer'
import NoProjects from './ui/NoProjects'

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newDiagramName, setNewDiagramName] = useState('')
    const [userName, setUserName] = useState('');
    const [token, setToken] = useState('');
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false); // Add loading state
    const dispatch = useDispatch();

    const isAuth = useSelector((state: RootState) => state.auth.isAuthenticated);
    const authToken = useSelector((state: RootState) => state.auth.token);

    const handleAddProject = async () => {
        if (!newDiagramName) {
            alert("Please enter a name for the diagram.");
            return;
        }
    
        setLoading(true); 
        setProgress(10); 
    
        try {
            
            let progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev < 70) {
                        return prev + 10;
                    } else {
                        clearInterval(progressInterval);
                        return prev;
                    }
                });
            }, 300);
    
            const response = await fetch('/api/project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ projectname: newDiagramName })
            });
    
            // Check if response is okay and has a valid JSON body
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error("Failed to parse JSON response:", jsonError);
                throw new Error("Unexpected response format from the server");
            }
    
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create project');
            }
    
            setProgress(80); 
            setProjects((prevProjects) => [...prevProjects, result.project]); 
            setProgress(100);
            setNewDiagramName('');
    
        } catch (error: any) {
            console.error("Error creating project:", error);
            setProgress(100);
            alert(error.message || "An error occurred while creating the project.");
        } finally {
            setLoading(false); 
            setIsAddDialogOpen(false); 
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        try {
          const response = await fetch(`/api/project`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify({ projectId })
          });
    
          if (!response.ok) {
            throw new Error('Failed to delete the project');
          }
          
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert('An error occurred while deleting the project');
        }
      };
    useEffect(() => {
        
        dispatch(loadAuthState());
    }, [dispatch]);

    useEffect(() => {
        
        if (isAuth && authToken) {
            setToken(authToken);
        }
    }, [isAuth, authToken]);

    useEffect(() => {
        const validateToken = async () => {
            try {
                
                setProgress(10);

                
                let progressInterval = setInterval(() => {
                    setProgress((prev) => {
                        if (prev < 70) {
                            return prev + 10;
                        } else {
                            clearInterval(progressInterval);
                            return prev;
                        }
                    });
                }, 300);

                setTimeout(async () => {
                    const response = await fetch('/api/auth/validate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const results = await response.json();

                    if (!response.ok) {
                        dispatch(logout());
                        throw new Error("Validation failed: " + results.message);
                    }

                    setProgress(80);
                    const { username, projects } = results;
                    setUserName(username);
                    setProjects(projects);
                    setProgress(100);

                }, 300);

            } catch (error) {
                console.log("Error during token validation:", error);
                setProgress(100);
            }
        };

        if (isAuth && token) {
            validateToken();
        }
    }, [token, isAuth, dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        setToken('');
    };

    return (
        <div className="min-h-fit pt-20 text-slate-900">
            <main className="container mx-auto px-4 py-8">
                {progress !== 100 || loading ? (
                    <div className="flex justify-center items-center h-[60vh]">
                        <Progress value={progress} className="w-[60%]" />
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Welcome <span className='font-semibold uppercase text-2xl text-slate-700'>{" " + userName}</span></h2>
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New Diagram
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Class Diagram</DialogTitle>
                                        <DialogDescription>
                                            Enter a name for your new class diagram.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label htmlFor="diagramName">Diagram Name</Label>
                                        <Input
                                            id="diagramName"
                                            value={newDiagramName}
                                            onChange={(e) => setNewDiagramName(e.target.value)}
                                            required
                                            placeholder="Enter diagram name"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddProject} disabled={loading}>Add Diagram</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <DiagramCard 
                                key={project.id} 
                                project={project}
                                handleDeleteProject={handleDeleteProject} />
                            ))}
                            {
                                projects.length == 0 &&
                                <div className='h-[50vh] flex items-center justify-center'>
                                    <NoProjects />
                                </div>
                            }
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
